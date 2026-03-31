// sanity/components/navigation/NavigationEditor.tsx
"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text } from "@sanity/ui";
import { PublishIcon } from "@sanity/icons";
import { LoadingDots } from "../shared/ui";
import { CategoryItem } from "./CategoryItem";
import type {
  NavigationDoc,
  NavCategoryRaw,
  NavItemRaw,
  CategoryDoc,
  PageDoc,
  RightPanelState,
} from "./types";

// ── Ref type for parent access ──────────────────────

export type NavigationEditorRef = {
  categories: NavCategoryRaw[];
  pagesMap: Map<string, PageDoc>;
  categoryDocs: Map<string, CategoryDoc>;
  allPages: PageDoc[];
  addPage: (categoryKey: string, pageId: string) => void;
  reorderPages: (categoryKey: string, reordered: NavItemRaw[]) => void;
  togglePageHidden: (categoryKey: string, itemKey: string) => void;
  removePage: (categoryKey: string, itemKey: string) => void;
  addCategoryToNav: (categoryId: string) => void;
  handleCategoryRenamed: (categoryId: string, newLabel: { _key: string; value: string }[]) => void;
  onHeroImageChanged: (categoryId: string, assetRef: string) => Promise<void>;
};

// ── NavigationEditor ────────────────────────────────

export const NavigationEditor = forwardRef<
  NavigationEditorRef,
  {
    onOpenPanel: (panel: RightPanelState) => void;
    rightPanel: RightPanelState;
  }
>(function NavigationEditor({ onOpenPanel, rightPanel }, ref) {
  const client = useClient({ apiVersion: "2024-01-01" });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "dirty" | "saving" | "error">("saved");

  // Document state
  const [publishedNav, setPublishedNav] = useState<NavigationDoc | null>(null);
  const [draftNav, setDraftNav] = useState<NavigationDoc | null>(null);
  const [categories, setCategories] = useState<NavCategoryRaw[]>([]);
  const [categoryDocs, setCategoryDocs] = useState<Map<string, CategoryDoc>>(new Map());
  const [allPages, setAllPages] = useState<PageDoc[]>([]);

  // Refs to avoid stale closures in async callbacks (saveToSanity, deleteCategory)
  const publishedNavRef = useRef(publishedNav);
  publishedNavRef.current = publishedNav;
  const draftNavRef = useRef(draftNav);
  draftNavRef.current = draftNav;
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  // UI state
  const dragIdxRef = useRef<number | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  // Auto-save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCategoriesRef = useRef<NavCategoryRaw[] | null>(null);

  // Pages map for quick lookup
  const pagesMap = useMemo(() => {
    const map = new Map<string, PageDoc>();
    for (const p of allPages) map.set(p._id, p);
    return map;
  }, [allPages]);

  // ── Load data ─────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pubNav, draftNavDoc, catDocs, pages] = await Promise.all([
        client.fetch<NavigationDoc | null>(
          `*[_id == "navigation"][0]{ _id, _type, _rev, categories[]{ _key, _type, categoryRef, items[]{ _key, _type, pageRef, hidden } } }`,
        ),
        client.fetch<NavigationDoc | null>(
          `*[_id == "drafts.navigation"][0]{ _id, _type, _rev, categories[]{ _key, _type, categoryRef, items[]{ _key, _type, pageRef, hidden } } }`,
        ),
        client.fetch<CategoryDoc[]>(
          `*[_type == "category" && !(_id in path("drafts.**"))] | order(_createdAt asc) { _id, _type, label, description, heroImage }`,
        ),
        client.fetch<PageDoc[]>(
          `*[_type == "page" && !(_id in path("drafts.**"))] | order(_id asc) { _id, _type, title, slug, categoryRef, "coverImage": images[0] }`,
        ),
      ]);

      setPublishedNav(pubNav);
      setDraftNav(draftNavDoc);

      const navDoc = draftNavDoc ?? pubNav;
      setCategories(navDoc?.categories ?? []);

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

  // ── Auto-save logic ───────────────────────────────

  const saveToSanity = useCallback(async () => {
    const pending = pendingCategoriesRef.current;
    if (!pending) return;
    pendingCategoriesRef.current = null;

    setSaving(true);
    setSaveStatus("saving");

    try {
      // Read from refs to avoid stale closures
      const baseDoc = draftNavRef.current ?? publishedNavRef.current;
      if (!baseDoc) return;

      const draftId = "drafts.navigation";
      const tx = client.transaction();
      tx.createIfNotExists({
        ...baseDoc,
        _id: draftId,
        _type: "navigation",
      });
      tx.patch(draftId, (p) => p.set({ categories: pending }));
      await tx.commit();

      const refreshed = await client.fetch<NavigationDoc | null>(
        `*[_id == "drafts.navigation"][0]{ _id, _type, _rev, categories[]{ _key, _type, categoryRef, items[]{ _key, _type, pageRef, hidden } } }`,
      );
      setDraftNav(refreshed);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [client]);

  const updateCategories = useCallback(
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
    if (pendingCategoriesRef.current) {
      await saveToSanity();
    }
  }, [saveToSanity]);

  // ── Publish ───────────────────────────────────────

  const handlePublish = useCallback(async () => {
    await flushSave();

    setSaving(true);
    setSaveStatus("saving");
    try {
      const draft = draftNav;
      if (!draft) {
        setSaveStatus("saved");
        setSaving(false);
        return;
      }

      const { _rev, ...rest } = draft;
      const tx = client.transaction();
      tx.createOrReplace({ ...rest, _id: "navigation", _type: "navigation" });
      tx.delete("drafts.navigation");

      // Sync categoryRef on pages
      const navCategories = draft.categories ?? [];
      const assignedPageIds = new Set<string>();
      for (const navCat of navCategories) {
        const catRef = navCat.categoryRef?._ref;
        if (!catRef) continue;
        for (const item of navCat.items ?? []) {
          const pageRef = item.pageRef?._ref;
          if (!pageRef) continue;
          assignedPageIds.add(pageRef);
          tx.patch(pageRef, (p) => p.set({ categoryRef: { _type: "reference", _ref: catRef } }));
        }
      }

      // Clear categoryRef on pages no longer in any category
      for (const page of allPages) {
        if (page.categoryRef?._ref && !assignedPageIds.has(page._id)) {
          tx.patch(page._id, (p) => p.unset(["categoryRef"]));
        }
      }

      await tx.commit();

      // Refresh
      const pubNav = await client.fetch<NavigationDoc | null>(
        `*[_id == "navigation"][0]{ _id, _type, _rev, categories[]{ _key, _type, categoryRef, items[]{ _key, _type, pageRef, hidden } } }`,
      );
      setPublishedNav(pubNav);
      setDraftNav(null);
      setCategories(pubNav?.categories ?? []);

      const refreshedPages = await client.fetch<PageDoc[]>(
        `*[_type == "page" && !(_id in path("drafts.**"))] | order(_id asc) { _id, _type, title, slug, categoryRef }`,
      );
      setAllPages(refreshedPages);

      setSaveStatus("saved");
    } catch (err) {
      console.error("Publish failed:", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [client, draftNav, allPages, flushSave]);

  // ── Category operations ───────────────────────────

  const togglePageHidden = useCallback(
    (categoryKey: string, itemKey: string) => {
      const next = categories.map((cat) => {
        if (cat._key !== categoryKey) return cat;
        return {
          ...cat,
          items: (cat.items ?? []).map((item) =>
            item._key === itemKey ? { ...item, hidden: !item.hidden } : item,
          ),
        };
      });
      updateCategories(next);
    },
    [categories, updateCategories],
  );

  const removePage = useCallback(
    (categoryKey: string, itemKey: string) => {
      const next = categories.map((cat) => {
        if (cat._key !== categoryKey) return cat;
        return {
          ...cat,
          items: (cat.items ?? []).filter((item) => item._key !== itemKey),
        };
      });
      updateCategories(next);
    },
    [categories, updateCategories],
  );

  const addPage = useCallback(
    (categoryKey: string, pageId: string) => {
      const newItem: NavItemRaw = {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        _type: "object",
        pageRef: { _type: "reference", _ref: pageId },
        hidden: false,
      };
      const next = categories.map((cat) => {
        if (cat._key !== categoryKey) return cat;
        return { ...cat, items: [...(cat.items ?? []), newItem] };
      });
      updateCategories(next);
    },
    [categories, updateCategories],
  );

  const reorderPages = useCallback(
    (categoryKey: string, reordered: NavItemRaw[]) => {
      const next = categories.map((cat) => {
        if (cat._key !== categoryKey) return cat;
        return { ...cat, items: reordered };
      });
      updateCategories(next);
    },
    [categories, updateCategories],
  );

  const addCategoryToNav = useCallback(
    (categoryId: string) => {
      const newCat: NavCategoryRaw = {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        _type: "object",
        categoryRef: { _type: "reference", _ref: categoryId },
        items: [],
      };
      updateCategories([...categories, newCat]);
      client
        .fetch<CategoryDoc>(`*[_id == $id][0]{ _id, _type, label, description, heroImage }`, {
          id: categoryId,
        })
        .then((doc) => {
          if (doc) {
            setCategoryDocs((prev) => {
              const next = new Map(prev);
              next.set(doc._id, doc);
              return next;
            });
          }
        });
      onOpenPanel(null);
    },
    [client, categories, updateCategories, onOpenPanel],
  );

  const handleCategoryRenamed = useCallback(
    (categoryId: string, newLabel: { _key: string; value: string }[]) => {
      setCategoryDocs((prev) => {
        const next = new Map(prev);
        const existing = next.get(categoryId);
        if (existing) next.set(categoryId, { ...existing, label: newLabel });
        return next;
      });
      onOpenPanel(null);
    },
    [onOpenPanel],
  );

  const onHeroImageChanged = useCallback(
    async (categoryId: string, assetRef: string) => {
      await client
        .patch(categoryId)
        .set({
          heroImage: { _type: "image", asset: { _type: "reference", _ref: assetRef } },
        })
        .commit();

      setCategoryDocs((prev) => {
        const next = new Map(prev);
        const existing = next.get(categoryId);
        if (existing) {
          next.set(categoryId, {
            ...existing,
            heroImage: { _type: "image", asset: { _type: "reference", _ref: assetRef } },
          });
        }
        return next;
      });
    },
    [client],
  );

  const deleteCategory = useCallback(
    async (categoryKey: string) => {
      // Read from ref to avoid stale closure
      const currentCategories = categoriesRef.current;
      const navCat = currentCategories.find((c) => c._key === categoryKey);
      if (!navCat) return;
      const catRef = navCat.categoryRef?._ref;
      if (!catRef) return;

      // Check if referenced in homepageFeatured
      const featured = await client.fetch<Record<string, unknown> | null>(
        `*[_type == "homepageFeatured"][0]{
          "refs": [slot1.categoryRef._ref, slot2.categoryRef._ref, slot3.categoryRef._ref, slot4.categoryRef._ref]
        }`,
      );
      const refs = (featured?.refs as string[]) ?? [];
      if (refs.includes(catRef)) {
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

      // Re-read from ref after flush (flush may have updated state)
      const next = categoriesRef.current.filter((c) => c._key !== categoryKey);
      pendingCategoriesRef.current = next;
      setCategories(next);
      await saveToSanity();

      try {
        await client.delete(catRef);
        await client.delete(`drafts.${catRef}`).catch(() => {});
      } catch (err) {
        console.error("Failed to delete category:", err);
      }

      setCategoryDocs((prev) => {
        const newMap = new Map(prev);
        newMap.delete(catRef);
        return newMap;
      });
    },
    [client, flushSave, saveToSanity],
  );

  // ── Expose ref for parent ─────────────────────────

  useImperativeHandle(
    ref,
    () => ({
      categories,
      pagesMap,
      categoryDocs,
      allPages,
      addPage,
      reorderPages,
      togglePageHidden,
      removePage,
      addCategoryToNav,
      handleCategoryRenamed,
      onHeroImageChanged,
    }),
    [
      categories,
      pagesMap,
      categoryDocs,
      allPages,
      addPage,
      reorderPages,
      togglePageHidden,
      removePage,
      addCategoryToNav,
      handleCategoryRenamed,
      onHeroImageChanged,
    ],
  );

  // ── Drag-and-drop reorder ─────────────────────────

  const handleDragStart = useCallback((idx: number, key: string) => {
    dragIdxRef.current = idx;
    setDraggingKey(key);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, idx: number) => {
      e.preventDefault();
      const fromIdx = dragIdxRef.current;
      if (fromIdx === null || fromIdx === idx) return;
      const next = [...categories];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(idx, 0, moved);
      setCategories(next);
      dragIdxRef.current = idx;
    },
    [categories],
  );

  const handleDragEnd = useCallback(() => {
    dragIdxRef.current = null;
    setDraggingKey(null);
    // Read current categories from ref (avoids side effect in state updater)
    updateCategories(categoriesRef.current);
  }, [updateCategories]);

  // ── Status labels ─────────────────────────────────

  const statusLabel: Record<string, string> = {
    saved: "保存済み",
    dirty: "未保存",
    saving: "保存中…",
    error: "保存エラー",
  };
  const statusTone: Record<string, string> = {
    saved: "var(--card-muted-fg-color)",
    dirty: "#b08000",
    saving: "var(--card-muted-fg-color)",
    error: "#cc3333",
  };

  const hasDraft = !!draftNav;

  // ── Render ────────────────────────────────────────

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ height: "100%" }}>
        <LoadingDots />
      </Flex>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box
        padding={3}
        style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}
      >
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={2}>
            <Text size={1} weight="semibold">
              ナビゲーション
            </Text>
            <Text size={0} style={{ color: statusTone[saveStatus] }}>
              {statusLabel[saveStatus]}
            </Text>
          </Flex>
          <Button
            icon={PublishIcon}
            text="公開"
            tone="positive"
            fontSize={1}
            padding={2}
            onClick={handlePublish}
            disabled={saving || !hasDraft}
          />
        </Flex>
        <Text size={0} muted style={{ marginTop: 4 }}>
          サイトのメニューを管理します
        </Text>
      </Box>

      {/* Category list */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {categories.map((navCat, idx) => (
          <CategoryItem
            key={navCat._key}
            navCategory={navCat}
            categoryDoc={categoryDocs.get(navCat.categoryRef?._ref)}
            pagesMap={pagesMap}
            isActive={
              rightPanel !== null &&
              "categoryKey" in rightPanel &&
              rightPanel.categoryKey === navCat._key
            }
            onOpenPanel={onOpenPanel}
            onDeleteCategory={() => deleteCategory(navCat._key)}
            draggable
            onDragStart={() => handleDragStart(idx, navCat._key)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            isDragging={draggingKey === navCat._key}
          />
        ))}

        {/* Add section button */}
        <div style={{ padding: "16px 12px" }}>
          <button
            type="button"
            onClick={() => onOpenPanel({ type: "addCategory" })}
            style={{
              fontSize: 13,
              padding: "8px 16px",
              border: "1px dashed var(--card-border-color)",
              borderRadius: 6,
              background: "transparent",
              cursor: "pointer",
              color: "var(--card-muted-fg-color)",
              width: "100%",
            }}
          >
            + セクションを追加
          </button>
        </div>
      </div>
    </div>
  );
});
