// sanity/components/unified-pages/useNavData.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import type {
  NavigationDoc,
  NavCategoryRaw,
  NavItemRaw,
  CategoryDoc,
  NavPageDoc,
  ImageField,
  I18nString,
} from "./types";

// ── GROQ queries ──────────────────────────────────────────

const NAV_PROJECTION = `{ _id, _type, _rev, categories[]{ _key, _type, categoryRef, items[]{ _key, _type, pageRef, hidden } } }`;
const PUB_NAV_QUERY = `*[_id == "navigation"][0]${NAV_PROJECTION}`;
const DRAFT_NAV_QUERY = `*[_id == "drafts.navigation"][0]${NAV_PROJECTION}`;
const CAT_DOCS_QUERY = `*[_type == "category" && !(_id in path("drafts.**"))] | order(_createdAt asc) { _id, _type, label, description, heroImage }`;
const PAGES_QUERY = `*[_type == "page" && !(_id in path("drafts.**"))] | order(_id asc) { _id, _type, title, slug, categoryRef, "firstImage": images[0].file, description[]{ _key, value } }`;

// ── Hook ─────────────────────────────────────────────────

export type NavSaveStatus = "saved" | "dirty" | "saving" | "error";

export function useNavData() {
  const client = useClient({ apiVersion: "2024-01-01" });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<NavSaveStatus>("saved");

  const [publishedNav, setPublishedNav] = useState<NavigationDoc | null>(null);
  const [draftNav, setDraftNav] = useState<NavigationDoc | null>(null);
  const [categories, setCategories] = useState<NavCategoryRaw[]>([]);
  const [categoryDocs, setCategoryDocs] = useState<Map<string, CategoryDoc>>(new Map());
  const [allPages, setAllPages] = useState<NavPageDoc[]>([]);

  // Refs to avoid stale closures in async callbacks
  const publishedNavRef = useRef(publishedNav);
  publishedNavRef.current = publishedNav;
  const draftNavRef = useRef(draftNav);
  draftNavRef.current = draftNav;
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;
  const allPagesRef = useRef(allPages);
  allPagesRef.current = allPages;

  // Auto-save timer
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCategoriesRef = useRef<NavCategoryRaw[] | null>(null);

  const pagesMap = useMemo(() => {
    const map = new Map<string, NavPageDoc>();
    for (const p of allPages) map.set(p._id, p);
    return map;
  }, [allPages]);

  const hasDraft = !!draftNav;

  // ── Load ──────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pubNav, draftNavDoc, catDocs, pages] = await Promise.all([
        client.fetch<NavigationDoc | null>(PUB_NAV_QUERY),
        client.fetch<NavigationDoc | null>(DRAFT_NAV_QUERY),
        client.fetch<CategoryDoc[]>(CAT_DOCS_QUERY),
        client.fetch<NavPageDoc[]>(PAGES_QUERY),
      ]);
      setPublishedNav(pubNav);
      setDraftNav(draftNavDoc);
      setCategories((draftNavDoc ?? pubNav)?.categories ?? []);
      const catMap = new Map<string, CategoryDoc>();
      for (const c of catDocs) catMap.set(c._id, c);
      setCategoryDocs(catMap);
      setAllPages(pages);
    } catch (err) {
      console.error("Failed to load navigation data:", err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Save to draft (debounced) ─────────────────────────

  const publishNavDirectly = useCallback(
    async (draft: NavigationDoc) => {
      setSaving(true);
      setSaveStatus("saving");
      try {
        const { _rev, ...rest } = draft;
        const tx = client.transaction();
        tx.createOrReplace({ ...rest, _id: "navigation", _type: "navigation" });
        tx.delete("drafts.navigation");
        const assignedPageIds = new Set<string>();
        for (const navCat of draft.categories ?? []) {
          const catRef = navCat.categoryRef?._ref;
          if (!catRef) continue;
          for (const item of navCat.items ?? []) {
            const pageRef = item.pageRef?._ref;
            if (!pageRef) continue;
            assignedPageIds.add(pageRef);
            tx.patch(pageRef, (p) => p.set({ categoryRef: { _type: "reference", _ref: catRef } }));
          }
        }
        for (const page of allPagesRef.current) {
          if (page.categoryRef?._ref && !assignedPageIds.has(page._id)) {
            tx.patch(page._id, (p) => p.unset(["categoryRef"]));
          }
        }
        await tx.commit();
        const [pubNav, refreshedPages] = await Promise.all([
          client.fetch<NavigationDoc | null>(PUB_NAV_QUERY),
          client.fetch<NavPageDoc[]>(PAGES_QUERY),
        ]);
        setPublishedNav(pubNav);
        setDraftNav(null);
        setCategories(pubNav?.categories ?? []);
        setAllPages(refreshedPages);
        setSaveStatus("saved");
      } catch (err) {
        console.error("Publish failed:", err);
        setSaveStatus("error");
      } finally {
        setSaving(false);
      }
    },
    [client],
  );

  const saveToSanity = useCallback(async () => {
    const pending = pendingCategoriesRef.current;
    if (!pending) return;
    pendingCategoriesRef.current = null;
    setSaving(true);
    setSaveStatus("saving");
    try {
      const baseDoc = draftNavRef.current ?? publishedNavRef.current;
      if (!baseDoc) {
        setSaveStatus("saved");
        return;
      }
      const draftId = "drafts.navigation";
      const tx = client.transaction();
      tx.createIfNotExists({ ...baseDoc, _id: draftId, _type: "navigation" });
      tx.patch(draftId, (p) => p.set({ categories: pending }));
      await tx.commit();
      const refreshed = await client.fetch<NavigationDoc | null>(DRAFT_NAV_QUERY);
      setDraftNav(refreshed);
      // Auto-publish: draft is an invisible implementation detail
      if (refreshed) await publishNavDirectly(refreshed);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [client, publishNavDirectly]);

  const saveToDraft = useCallback(
    (next: NavCategoryRaw[]) => {
      setCategories(next);
      pendingCategoriesRef.current = next;
      setSaveStatus("dirty");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveToSanity(), 1500);
    },
    [saveToSanity],
  );

  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (pendingCategoriesRef.current) await saveToSanity();
  }, [saveToSanity]);

  // ── Publish nav draft ─────────────────────────────────

  const publishNav = useCallback(async () => {
    await flushSave();
    const draft = draftNavRef.current;
    if (!draft) {
      setSaveStatus("saved");
      setSaving(false);
      return;
    }
    await publishNavDirectly(draft);
  }, [flushSave, publishNavDirectly]);

  // ── Reorder (publish immediately) ────────────────────

  const publishCategoryReorder = useCallback(
    async (newCategories: NavCategoryRaw[]) => {
      setCategories(newCategories);
      setSaving(true);
      setSaveStatus("saving");
      try {
        const tx = client.transaction();
        // Write to published doc
        const pubNav = publishedNavRef.current;
        if (pubNav) {
          tx.patch("navigation", (p) => p.set({ categories: newCategories }));
        } else {
          // Navigation not yet published — create it
          tx.createOrReplace({ _id: "navigation", _type: "navigation", categories: newCategories });
        }
        // Keep draft in sync if it exists
        if (draftNavRef.current) {
          tx.patch("drafts.navigation", (p) => p.set({ categories: newCategories }));
        }
        await tx.commit();
        const pubNavRefreshed = await client.fetch<NavigationDoc | null>(PUB_NAV_QUERY);
        setPublishedNav(pubNavRefreshed);
        setSaveStatus("saved");
      } catch (err) {
        console.error("Reorder failed:", err);
        setSaveStatus("error");
      } finally {
        setSaving(false);
      }
    },
    [client],
  );

  const publishPageReorder = useCallback(
    async (categoryKey: string, newItems: NavItemRaw[]) => {
      const newCategories = categoriesRef.current.map((cat) =>
        cat._key === categoryKey ? { ...cat, items: newItems } : cat,
      );
      await publishCategoryReorder(newCategories);
    },
    [publishCategoryReorder],
  );

  // ── Page operations (draft) ───────────────────────────

  const togglePageHidden = useCallback(
    (categoryKey: string, itemKey: string) => {
      const next = categoriesRef.current.map((cat) => {
        if (cat._key !== categoryKey) return cat;
        return {
          ...cat,
          items: (cat.items ?? []).map((item) =>
            item._key === itemKey ? { ...item, hidden: !item.hidden } : item,
          ),
        };
      });
      saveToDraft(next);
    },
    [saveToDraft],
  );

  const removePage = useCallback(
    (categoryKey: string, itemKey: string) => {
      const next = categoriesRef.current.map((cat) => {
        if (cat._key !== categoryKey) return cat;
        return { ...cat, items: (cat.items ?? []).filter((item) => item._key !== itemKey) };
      });
      saveToDraft(next);
    },
    [saveToDraft],
  );

  const addPageToNav = useCallback(
    (categoryKey: string, pageId: string) => {
      const newItem: NavItemRaw = {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        _type: "object",
        pageRef: { _type: "reference", _ref: pageId },
        hidden: true, // new pages default to 非表示
      };
      const next = categoriesRef.current.map((cat) => {
        if (cat._key !== categoryKey) return cat;
        return { ...cat, items: [...(cat.items ?? []), newItem] };
      });
      saveToDraft(next);
    },
    [saveToDraft],
  );

  const addCategoryToNav = useCallback(
    (categoryId: string, categoryDoc: CategoryDoc) => {
      const newCat: NavCategoryRaw = {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        _type: "object",
        categoryRef: { _type: "reference", _ref: categoryId },
        items: [],
      };
      const next = [...categoriesRef.current, newCat];
      saveToDraft(next);
      setCategoryDocs((prev) => {
        const map = new Map(prev);
        map.set(categoryId, categoryDoc);
        return map;
      });
    },
    [saveToDraft],
  );

  const handleCategoryRenamed = useCallback((categoryId: string, newLabel: I18nString[]) => {
    setCategoryDocs((prev) => {
      const map = new Map(prev);
      const existing = map.get(categoryId);
      if (existing) map.set(categoryId, { ...existing, label: newLabel });
      return map;
    });
  }, []);

  const onHeroImageChanged = useCallback(
    async (categoryId: string, image: ImageField) => {
      await client.patch(categoryId).set({ heroImage: image }).commit();
      setCategoryDocs((prev) => {
        const map = new Map(prev);
        const existing = map.get(categoryId);
        if (existing) map.set(categoryId, { ...existing, heroImage: image });
        return map;
      });
    },
    [client],
  );

  const deleteCategory = useCallback(
    async (categoryKey: string) => {
      const navCat = categoriesRef.current.find((c) => c._key === categoryKey);
      if (!navCat) return;
      const catRef = navCat.categoryRef?._ref;
      if (!catRef) return;
      // Check homepageFeatured references
      const featured = await client.fetch<{ refs: string[] } | null>(
        `*[_type == "homepageFeatured"][0]{
          "refs": [slot1.categoryRef._ref, slot2.categoryRef._ref, slot3.categoryRef._ref, slot4.categoryRef._ref]
        }`,
      );
      if ((featured?.refs ?? []).includes(catRef)) {
        alert(
          "このカテゴリーはホームページで使用中のため削除できません。\n(This category is used on the homepage and cannot be deleted.)",
        );
        return;
      }
      const ok = confirm(
        "このセクションを削除しますか？セクション内のページは削除されません。\n(Delete this section? Pages within it will not be deleted.)",
      );
      if (!ok) return;
      await flushSave();
      const next = categoriesRef.current.filter((c) => c._key !== categoryKey);
      pendingCategoriesRef.current = next;
      setCategories(next);
      await saveToSanity();
      try {
        await client.delete(catRef);
        await client.delete(`drafts.${catRef}`).catch(() => {});
      } catch (err) {
        console.error("Failed to delete category document:", err);
      }
      setCategoryDocs((prev) => {
        const map = new Map(prev);
        map.delete(catRef);
        return map;
      });
    },
    [client, flushSave, saveToSanity],
  );

  const refreshPages = useCallback(async () => {
    try {
      const pages = await client.fetch<NavPageDoc[]>(PAGES_QUERY);
      setAllPages(pages);
    } catch (err) {
      console.error("Failed to refresh pages:", err);
    }
  }, [client]);

  return {
    loading,
    saving,
    saveStatus,
    hasDraft,
    categories,
    categoryDocs,
    allPages,
    pagesMap,
    togglePageHidden,
    removePage,
    addPageToNav,
    addCategoryToNav,
    handleCategoryRenamed,
    onHeroImageChanged,
    deleteCategory,
    flushSave,
    publishNav,
    publishCategoryReorder,
    publishPageReorder,
    refreshPages,
  };
}
