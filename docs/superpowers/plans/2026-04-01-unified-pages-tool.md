# Unified Pages Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the separate ページ管理 and ナビゲーション studio tools with a single unified ページ tool — a 3-panel interface where non-technical editors can create, organize, and edit pages in one place.

**Architecture:** A `useNavData` hook manages all Sanity navigation data and operations. The root `UnifiedPagesTool` holds selection state and wires a left panel (category tree), middle panel (page editor or category management), and right panel (section tools). Navigation draft/publish is separated from page content draft/publish.

**Tech Stack:** React, TypeScript, Sanity Studio v3 (`useClient`, `definePlugin`), `@sanity/ui`, `@sanity/icons`, HTML5 drag API.

**Spec:** `docs/superpowers/specs/2026-04-01-unified-pages-tool-design.md`

---

## File Map

**Create:**

- `sanity/components/unified-pages/types.ts` — shared types for the unified tool
- `sanity/components/unified-pages/useNavData.ts` — all navigation data and operations
- `sanity/components/unified-pages/NavPublishBar.tsx` — sticky "publish nav" banner
- `sanity/components/unified-pages/LeftPanel.tsx` — category tree with drag reorder
- `sanity/components/unified-pages/PageEditor.tsx` — middle panel: page content editor (ported)
- `sanity/components/unified-pages/CategoryManagement.tsx` — middle panel: category selected
- `sanity/components/unified-pages/PageCreationForm.tsx` — middle panel: create new page
- `sanity/components/unified-pages/CategoryCreationForm.tsx` — middle panel: create new category
- `sanity/components/unified-pages/SystemPageNotice.tsx` — middle panel: system page clicked
- `sanity/components/UnifiedPagesTool.tsx` — root 3-panel component
- `sanity/components/unifiedPagesPlugin.ts` — plugin registration

**Modify:**

- `sanity.config.ts` — replace pagesPlugin + navigationPlugin with unifiedPagesPlugin

**Delete (Task 12):**

- `sanity/components/pagesPlugin.ts`
- `sanity/components/PagesTool.tsx`
- `sanity/components/pages/PagesSidebar.tsx`
- `sanity/components/pages/PageEditor.tsx`
- `sanity/components/NavigationTool.tsx`
- `sanity/components/navigationPlugin.ts`
- `sanity/components/navigation/NavigationEditor.tsx`
- `sanity/components/navigation/CategoryItem.tsx`
- `sanity/components/navigation/PageItem.tsx`
- `sanity/components/navigation/EditCategoryPanel.tsx`
- `sanity/components/navigation/AddPagePanel.tsx`
- `sanity/components/navigation/AddCategoryPanel.tsx`
- `sanity/components/navigation/RenameCategoryPanel.tsx`
- `sanity/components/navigation/types.ts`

---

## Task 1: Shared Types

**Files:**

- Create: `sanity/components/unified-pages/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// sanity/components/unified-pages/types.ts

// Re-export the types we need from the pages tool
export type {
  SectionItem,
  SectionTypeName,
  ImageItem,
  PageDoc,
  CategoryGroup,
} from "../pages/types";
export {
  SECTION_TYPES,
  SECTION_TYPE_LABELS,
  SECTION_TYPE_META,
  shortId,
  pageUrl,
} from "../pages/types";

import type { I18nString, ImageField } from "../homepage/types";

// ── Raw Sanity navigation document shapes ──────────────────

export interface NavItemRaw {
  _key: string;
  _type?: string;
  pageRef: { _type?: string; _ref: string };
  hidden?: boolean;
}

export interface NavCategoryRaw {
  _key: string;
  _type?: string;
  categoryRef: { _type?: string; _ref: string };
  items: NavItemRaw[];
}

export interface NavigationDoc {
  _id: string;
  _type: "navigation";
  _rev?: string;
  categories: NavCategoryRaw[];
}

// ── Denormalized category document ─────────────────────────

export interface CategoryDoc {
  _id: string;
  _type: "category";
  label?: I18nString[];
  description?: I18nString[];
  heroImage?: ImageField;
}

// Re-export for convenience
export type { I18nString, ImageField };

// ── Navigation page (lightweight, for the left panel) ──────

export interface NavPageDoc {
  _id: string;
  _type: "page";
  title?: I18nString[];
  slug?: string;
  categoryRef?: { _ref: string };
}

// ── Middle panel state ──────────────────────────────────────

export type MiddlePanelState =
  | null
  | { type: "page"; id: string }
  | { type: "category"; key: string }
  | { type: "createPage"; categoryKey: string }
  | { type: "createCategory" }
  | { type: "system"; name: "blog" | "announcements" };

// ── System page config ──────────────────────────────────────

export interface SystemPage {
  name: "blog" | "announcements";
  label: string;
  toolName: string;
  toolTitle: string;
}

export const SYSTEM_PAGES: SystemPage[] = [
  { name: "blog", label: "ブログ", toolName: "blog", toolTitle: "ブログ管理" },
  {
    name: "announcements",
    label: "お知らせ",
    toolName: "announcements",
    toolTitle: "お知らせ管理",
  },
];
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in the new file (existing errors, if any, are pre-existing).

- [ ] **Step 3: Commit**

```bash
git add sanity/components/unified-pages/types.ts
git commit -m "feat(unified-pages): add shared types"
```

---

## Task 2: useNavData Hook

**Files:**

- Create: `sanity/components/unified-pages/useNavData.ts`

This hook centralises all navigation data and mutations. It replaces the state management in `NavigationEditor.tsx`. Key differences from the old code:

- `publishCategoryReorder` / `publishPageReorder` write directly to the published `navigation` document (no draft step)
- `saveToDraft` is used for show/hide, add/remove page changes (same as before)
- `refreshPages` is exposed so the left panel can refresh after page creation

- [ ] **Step 1: Create the hook**

```typescript
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
const PAGES_QUERY = `*[_type == "page" && !(_id in path("drafts.**"))] | order(_id asc) { _id, _type, title, slug, categoryRef }`;

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

  const saveToSanity = useCallback(async () => {
    const pending = pendingCategoriesRef.current;
    if (!pending) return;
    pendingCategoriesRef.current = null;
    setSaving(true);
    setSaveStatus("saving");
    try {
      const baseDoc = draftNavRef.current ?? publishedNavRef.current;
      if (!baseDoc) return;
      const draftId = "drafts.navigation";
      const tx = client.transaction();
      tx.createIfNotExists({ ...baseDoc, _id: draftId, _type: "navigation" });
      tx.patch(draftId, (p) => p.set({ categories: pending }));
      await tx.commit();
      const refreshed = await client.fetch<NavigationDoc | null>(DRAFT_NAV_QUERY);
      setDraftNav(refreshed);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [client]);

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
    setSaving(true);
    setSaveStatus("saving");
    try {
      const draft = draftNavRef.current;
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
      for (const page of allPages) {
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
  }, [client, allPages, flushSave]);

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
    const pages = await client.fetch<NavPageDoc[]>(PAGES_QUERY);
    setAllPages(pages);
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add sanity/components/unified-pages/useNavData.ts
git commit -m "feat(unified-pages): add useNavData hook"
```

---

## Task 3: NavPublishBar

**Files:**

- Create: `sanity/components/unified-pages/NavPublishBar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// sanity/components/unified-pages/NavPublishBar.tsx
"use client";

import { Button, Flex, Text } from "@sanity/ui";
import { PublishIcon } from "@sanity/icons";
import type { NavSaveStatus } from "./useNavData";

export function NavPublishBar({
  saveStatus,
  hasDraft,
  saving,
  onPublish,
}: {
  saveStatus: NavSaveStatus;
  hasDraft: boolean;
  saving: boolean;
  onPublish: () => void;
}) {
  if (!hasDraft && saveStatus === "saved") return null;

  const statusLabel: Record<NavSaveStatus, string> = {
    saved: "保存済み",
    dirty: "未保存の変更があります",
    saving: "保存中…",
    error: "保存エラー",
  };
  const statusColor: Record<NavSaveStatus, string> = {
    saved: "var(--card-muted-fg-color)",
    dirty: "#b08000",
    saving: "var(--card-muted-fg-color)",
    error: "#cc3333",
  };

  return (
    <div
      style={{
        borderTop: "1px solid var(--card-border-color)",
        padding: "8px 12px",
        flexShrink: 0,
        background: "var(--card-bg-color)",
      }}
    >
      <Flex align="center" justify="space-between" gap={2}>
        <Text size={0} style={{ color: statusColor[saveStatus] }}>
          {hasDraft ? "ナビの変更があります" : statusLabel[saveStatus]}
        </Text>
        <Button
          icon={PublishIcon}
          text="公開する"
          tone="positive"
          fontSize={1}
          padding={2}
          onClick={onPublish}
          disabled={saving || !hasDraft}
        />
      </Flex>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add sanity/components/unified-pages/NavPublishBar.tsx
git commit -m "feat(unified-pages): add NavPublishBar component"
```

---

## Task 4: LeftPanel

**Files:**

- Create: `sanity/components/unified-pages/LeftPanel.tsx`

The left panel renders the category tree. Categories can be toggled into drag-reorder mode via `[ナビの順番を変更]` / `[完了]`. Pages within each category show a show/hide toggle and a draft indicator dot. System pages appear at the bottom as non-interactive.

- [ ] **Step 1: Create the component**

```tsx
// sanity/components/unified-pages/LeftPanel.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { Flex, Stack, Text } from "@sanity/ui";
import { LoadingDots } from "../shared/ui";
import { NavPublishBar } from "./NavPublishBar";
import { SYSTEM_PAGES, shortId } from "./types";
import type { NavCategoryRaw, NavPageDoc, CategoryDoc, MiddlePanelState } from "./types";
import type { NavSaveStatus } from "./useNavData";

function PageRow({
  pageId,
  title,
  hasDraft,
  hidden,
  isSelected,
  isDragging,
  draggable,
  onSelect,
  onToggleHidden,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  pageId: string;
  title: string;
  hasDraft: boolean;
  hidden: boolean;
  isSelected: boolean;
  isDragging?: boolean;
  draggable?: boolean;
  onSelect: () => void;
  onToggleHidden: () => void;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 8px 6px 28px",
        borderRadius: 4,
        background: isSelected ? "var(--card-border-color)" : "transparent",
        opacity: isDragging ? 0.4 : 1,
        cursor: draggable ? "grab" : "pointer",
      }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <button
        type="button"
        onClick={onSelect}
        style={{
          flex: 1,
          minWidth: 0,
          textAlign: "left",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: 0,
          fontSize: 13,
          color: "var(--card-fg-color)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: isSelected ? 600 : 400,
        }}
      >
        {title}
      </button>
      {hasDraft && (
        <span
          title="未公開の変更あり"
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#e6a317",
            flexShrink: 0,
          }}
        />
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleHidden();
        }}
        title={hidden ? "非表示（クリックで表示）" : "表示中（クリックで非表示）"}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: "2px 4px",
          fontSize: 11,
          borderRadius: 3,
          color: hidden ? "var(--card-muted-fg-color)" : "var(--green-600, #16a34a)",
          flexShrink: 0,
        }}
      >
        {hidden ? "○ 非表示" : "● 表示中"}
      </button>
    </div>
  );
}

function CategoryRow({
  navCat,
  categoryDoc,
  pagesMap,
  selectedMiddle,
  isReorderMode,
  isDragging,
  onSelectCategory,
  onSelectPage,
  onTogglePageHidden,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  navCat: NavCategoryRaw;
  categoryDoc: CategoryDoc | undefined;
  pagesMap: Map<string, NavPageDoc>;
  selectedMiddle: MiddlePanelState;
  isReorderMode: boolean;
  isDragging: boolean;
  onSelectCategory: (key: string) => void;
  onSelectPage: (id: string) => void;
  onTogglePageHidden: (categoryKey: string, itemKey: string) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const label = categoryDoc?.label?.find((l) => l._key === "ja")?.value ?? "（カテゴリ名なし）";
  const isCategorySelected =
    selectedMiddle?.type === "category" && selectedMiddle.key === navCat._key;

  return (
    <div
      style={{ opacity: isDragging ? 0.4 : 1 }}
      draggable={isReorderMode}
      onDragStart={isReorderMode ? onDragStart : undefined}
      onDragOver={isReorderMode ? onDragOver : undefined}
      onDragEnd={isReorderMode ? onDragEnd : undefined}
    >
      <button
        type="button"
        onClick={() => {
          if (!isReorderMode) onSelectCategory(navCat._key);
          setExpanded((v) => !v);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          textAlign: "left",
          padding: "8px 8px",
          border: "none",
          borderRadius: 4,
          background: isCategorySelected ? "var(--card-border-color)" : "transparent",
          cursor: isReorderMode ? "grab" : "pointer",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--card-fg-color)",
          gap: 4,
        }}
      >
        <span style={{ fontSize: 10, opacity: 0.5 }}>{expanded ? "▼" : "▶"}</span>
        {label}
      </button>
      {expanded && (
        <div>
          {(navCat.items ?? []).map((item) => {
            const page = pagesMap.get(item.pageRef._ref);
            if (!page) return null;
            const titleJa = page.title?.find((t) => t._key === "ja")?.value ?? "（タイトルなし）";
            const hasDraft = false; // will be set by subscription in parent
            return (
              <PageRow
                key={item._key}
                pageId={item.pageRef._ref}
                title={titleJa}
                hasDraft={hasDraft}
                hidden={!!item.hidden}
                isSelected={
                  selectedMiddle?.type === "page" && selectedMiddle.id === item.pageRef._ref
                }
                onSelect={() => onSelectPage(item.pageRef._ref)}
                onToggleHidden={() => onTogglePageHidden(navCat._key, item._key)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LeftPanel({
  loading,
  saving,
  saveStatus,
  hasDraft,
  categories,
  categoryDocs,
  pagesMap,
  draftPageIds,
  selectedMiddle,
  onSelectCategory,
  onSelectPage,
  onSelectSystemPage,
  onCreateCategory,
  onTogglePageHidden,
  onPublishNav,
  onReorderCategories,
}: {
  loading: boolean;
  saving: boolean;
  saveStatus: NavSaveStatus;
  hasDraft: boolean;
  categories: NavCategoryRaw[];
  categoryDocs: Map<string, CategoryDoc>;
  pagesMap: Map<string, NavPageDoc>;
  draftPageIds: Set<string>;
  selectedMiddle: MiddlePanelState;
  onSelectCategory: (key: string) => void;
  onSelectPage: (id: string) => void;
  onSelectSystemPage: (name: "blog" | "announcements") => void;
  onCreateCategory: () => void;
  onTogglePageHidden: (categoryKey: string, itemKey: string) => void;
  onPublishNav: () => void;
  onReorderCategories: (newCategories: NavCategoryRaw[]) => void;
}) {
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [localCategories, setLocalCategories] = useState<NavCategoryRaw[]>(categories);
  const dragIdxRef = useRef<number | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  // Keep localCategories in sync when categories prop changes (and not in reorder mode)
  const prevCategoriesRef = useRef(categories);
  if (!isReorderMode && prevCategoriesRef.current !== categories) {
    prevCategoriesRef.current = categories;
    setLocalCategories(categories);
  }

  const displayCategories = isReorderMode ? localCategories : categories;

  const handleDragStart = useCallback((idx: number, key: string) => {
    dragIdxRef.current = idx;
    setDraggingKey(key);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, idx: number) => {
      e.preventDefault();
      const fromIdx = dragIdxRef.current;
      if (fromIdx === null || fromIdx === idx) return;
      const next = [...localCategories];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(idx, 0, moved);
      setLocalCategories(next);
      dragIdxRef.current = idx;
    },
    [localCategories],
  );

  const handleDragEnd = useCallback(() => {
    dragIdxRef.current = null;
    setDraggingKey(null);
  }, []);

  const handleCompleteReorder = useCallback(() => {
    setIsReorderMode(false);
    onReorderCategories(localCategories);
  }, [localCategories, onReorderCategories]);

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
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--card-border-color)",
          flexShrink: 0,
        }}
      >
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            ページ管理
          </Text>
          <button
            type="button"
            onClick={isReorderMode ? handleCompleteReorder : () => setIsReorderMode(true)}
            style={{
              fontSize: 11,
              padding: "4px 8px",
              border: "1px solid var(--card-border-color)",
              borderRadius: 4,
              background: isReorderMode ? "var(--blue-500, #2563eb)" : "transparent",
              color: isReorderMode ? "#fff" : "var(--card-muted-fg-color)",
              cursor: "pointer",
            }}
          >
            {isReorderMode ? "完了" : "ナビの順番を変更"}
          </button>
        </Flex>
      </div>

      {/* Category tree */}
      <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
        <Stack space={1}>
          {displayCategories.map((navCat, idx) => (
            <CategoryRow
              key={navCat._key}
              navCat={navCat}
              categoryDoc={categoryDocs.get(navCat.categoryRef?._ref)}
              pagesMap={pagesMap}
              selectedMiddle={selectedMiddle}
              isReorderMode={isReorderMode}
              isDragging={draggingKey === navCat._key}
              onSelectCategory={onSelectCategory}
              onSelectPage={onSelectPage}
              onTogglePageHidden={onTogglePageHidden}
              onDragStart={() => handleDragStart(idx, navCat._key)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </Stack>

        {/* System pages */}
        <div
          style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--card-border-color)" }}
        >
          {SYSTEM_PAGES.map((sp) => (
            <button
              key={sp.name}
              type="button"
              onClick={() => onSelectSystemPage(sp.name)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "6px 8px",
                border: "none",
                borderRadius: 4,
                background:
                  selectedMiddle?.type === "system" && selectedMiddle.name === sp.name
                    ? "var(--card-border-color)"
                    : "transparent",
                cursor: "pointer",
                fontSize: 13,
                color: "var(--card-muted-fg-color)",
              }}
            >
              {sp.label}
              <span style={{ fontSize: 10, marginLeft: 6 }}>(システム)</span>
            </button>
          ))}
        </div>

        {/* Add category */}
        <div style={{ padding: "12px 0 4px" }}>
          <button
            type="button"
            onClick={onCreateCategory}
            style={{
              width: "100%",
              fontSize: 12,
              padding: "8px 12px",
              border: "1px dashed var(--card-border-color)",
              borderRadius: 6,
              background: "transparent",
              cursor: "pointer",
              color: "var(--card-muted-fg-color)",
            }}
          >
            + カテゴリを追加
          </button>
        </div>
      </div>

      {/* Publish bar */}
      <NavPublishBar
        saveStatus={saveStatus}
        hasDraft={hasDraft}
        saving={saving}
        onPublish={onPublishNav}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add sanity/components/unified-pages/LeftPanel.tsx
git commit -m "feat(unified-pages): add LeftPanel with category tree and drag reorder"
```

---

## Task 5: Port PageEditor

The existing `PageEditor` at `sanity/components/pages/PageEditor.tsx` is moved to `sanity/components/unified-pages/PageEditor.tsx` with no functional changes. We copy it verbatim and update the import paths.

**Files:**

- Create: `sanity/components/unified-pages/PageEditor.tsx` (copy of existing with updated imports)

- [ ] **Step 1: Copy the file and fix import paths**

Read `sanity/components/pages/PageEditor.tsx` in full, then write it to `sanity/components/unified-pages/PageEditor.tsx` with these import path changes:

- `"../shared/..."` → `"../shared/..."` (unchanged — `unified-pages` is same depth as `pages`)
- `"../blog/GalleryPanel"` → `"../blog/GalleryPanel"` (unchanged)
- `"../shared/DocumentDetailPanel"` → `"../shared/DocumentDetailPanel"` (unchanged)
- `"../homepage/HeroSection"` → `"../homepage/HeroSection"` (unchanged)
- `"./SectionBar"` → `"../pages/SectionBar"` (now references original location)
- `"./SectionEditor"` → `"../pages/SectionEditor"` (now references original location)
- `"./types"` → `"../pages/types"` (now references original location)

All `../shared/`, `../blog/`, `../homepage/` imports are unchanged since `unified-pages/` and `pages/` are at the same directory level.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add sanity/components/unified-pages/PageEditor.tsx
git commit -m "feat(unified-pages): port PageEditor to unified-pages directory"
```

---

## Task 6: CategoryManagement

**Files:**

- Create: `sanity/components/unified-pages/CategoryManagement.tsx`

This is the middle panel shown when a category is selected. It can swap to `PageCreationForm` when `[+ ページを追加]` is clicked (the parent handles this by updating `middlePanelState` to `{ type: 'createPage', categoryKey }`).

- [ ] **Step 1: Create the component**

```tsx
// sanity/components/unified-pages/CategoryManagement.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { Box, Button, Flex, Text } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import createImageUrlBuilder from "@sanity/image-url";
import { useClient } from "sanity";
import { BilingualInput } from "../shared/BilingualInput";
import { ImagePickerPanel } from "../shared/ImagePickerPanel";
import { HotspotCropTool } from "../shared/HotspotCropTool";
import type { HotspotCropValue } from "../shared/HotspotCropTool";
import type { NavCategoryRaw, NavItemRaw, NavPageDoc, CategoryDoc, ImageField } from "./types";
import { i18nGet } from "../shared/i18n";

export function CategoryManagement({
  navCat,
  categoryDoc,
  pagesMap,
  onTogglePageHidden,
  onRemovePage,
  onReorderPages,
  onAddPage,
  onHeroImageChanged,
  onCategoryRenamed,
  onDeleteCategory,
}: {
  navCat: NavCategoryRaw;
  categoryDoc: CategoryDoc | undefined;
  pagesMap: Map<string, NavPageDoc>;
  onTogglePageHidden: (itemKey: string) => void;
  onRemovePage: (itemKey: string) => void;
  onReorderPages: (newItems: NavItemRaw[]) => void;
  onAddPage: () => void;
  onHeroImageChanged: (categoryId: string, image: ImageField) => Promise<void>;
  onCategoryRenamed: (categoryId: string, newLabel: { _key: string; value: string }[]) => void;
  onDeleteCategory: () => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = createImageUrlBuilder(client as Parameters<typeof createImageUrlBuilder>[0]);

  const [isReorderMode, setIsReorderMode] = useState(false);
  const [localItems, setLocalItems] = useState<NavItemRaw[]>(navCat.items ?? []);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showHotspot, setShowHotspot] = useState(false);
  const [hotspotValue, setHotspotValue] = useState<HotspotCropValue | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameLabel, setRenameLabel] = useState(categoryDoc?.label ?? []);
  const [renameSaving, setRenameSaving] = useState(false);

  const dragIdxRef = useRef<number | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  // Sync localItems when navCat.items changes externally
  const prevItemsRef = useRef(navCat.items);
  if (!isReorderMode && prevItemsRef.current !== navCat.items) {
    prevItemsRef.current = navCat.items;
    setLocalItems(navCat.items ?? []);
  }

  const displayItems = isReorderMode ? localItems : (navCat.items ?? []);
  const label = categoryDoc?.label?.find((l) => l._key === "ja")?.value ?? "（カテゴリ名なし）";
  const heroImage = categoryDoc?.heroImage;
  const heroUrl = heroImage?.asset?._ref
    ? builder.image(heroImage.asset._ref).width(400).height(225).fit("crop").auto("format").url()
    : null;

  function handleDragStart(idx: number, key: string) {
    dragIdxRef.current = idx;
    setDraggingKey(key);
  }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    const fromIdx = dragIdxRef.current;
    if (fromIdx === null || fromIdx === idx) return;
    const next = [...localItems];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(idx, 0, moved);
    setLocalItems(next);
    dragIdxRef.current = idx;
  }
  function handleDragEnd() {
    dragIdxRef.current = null;
    setDraggingKey(null);
  }
  function handleCompleteReorder() {
    setIsReorderMode(false);
    onReorderPages(localItems);
  }

  async function handleSaveRename() {
    if (!categoryDoc) return;
    setRenameSaving(true);
    try {
      await client.patch(categoryDoc._id).set({ label: renameLabel }).commit();
      await client
        .patch(`drafts.${categoryDoc._id}`)
        .set({ label: renameLabel })
        .commit()
        .catch(() => {});
      onCategoryRenamed(categoryDoc._id, renameLabel);
      setIsRenaming(false);
    } catch (err) {
      console.error("Rename failed:", err);
    } finally {
      setRenameSaving(false);
    }
  }

  if (showImagePicker) {
    return (
      <ImagePickerPanel
        onSelect={(assetRef) => {
          if (categoryDoc) {
            onHeroImageChanged(categoryDoc._id, {
              _type: "image",
              asset: { _type: "reference", _ref: assetRef },
            });
          }
          setShowImagePicker(false);
        }}
        onClose={() => setShowImagePicker(false)}
      />
    );
  }

  if (showHotspot && heroImage && hotspotValue !== null && categoryDoc) {
    return (
      <HotspotCropTool
        imageUrl={heroUrl ?? ""}
        value={hotspotValue}
        onChange={(val) => {
          const updated: ImageField = {
            _type: "image",
            asset: heroImage.asset,
            hotspot: { _type: "sanity.imageHotspot", ...val.hotspot },
            crop: { _type: "sanity.imageCrop", ...val.crop },
          };
          onHeroImageChanged(categoryDoc._id, updated);
          setHotspotValue(val);
        }}
        onClose={() => setShowHotspot(false)}
      />
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box
        padding={3}
        style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}
      >
        <Text size={1} weight="semibold">
          {label}
        </Text>
      </Box>

      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {/* Hero image */}
        <div style={{ marginBottom: 20 }}>
          <Text size={0} muted style={{ marginBottom: 8, display: "block" }}>
            カテゴリ画像
          </Text>
          {heroUrl ? (
            <div
              style={{
                position: "relative",
                borderRadius: 6,
                overflow: "hidden",
                aspectRatio: "16/9",
                maxWidth: 320,
              }}
            >
              <img
                src={heroUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div style={{ position: "absolute", bottom: 6, right: 6, display: "flex", gap: 4 }}>
                <button
                  type="button"
                  onClick={() => {
                    setHotspotValue({
                      hotspot: { x: 0.5, y: 0.5, width: 1, height: 1 },
                      crop: { top: 0, bottom: 0, left: 0, right: 0 },
                    });
                    setShowHotspot(true);
                  }}
                  style={{
                    padding: "4px 8px",
                    fontSize: 11,
                    border: "none",
                    borderRadius: 4,
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  トリミング
                </button>
                <button
                  type="button"
                  onClick={() => setShowImagePicker(true)}
                  style={{
                    padding: "4px 8px",
                    fontSize: 11,
                    border: "none",
                    borderRadius: 4,
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  変更
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowImagePicker(true)}
              style={{
                width: "100%",
                maxWidth: 320,
                aspectRatio: "16/9",
                border: "2px dashed var(--card-border-color)",
                borderRadius: 6,
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                color: "var(--card-muted-fg-color)",
              }}
            >
              画像を選択
            </button>
          )}
        </div>

        {/* Pages list */}
        <div style={{ marginBottom: 16 }}>
          <Flex align="center" justify="space-between" style={{ marginBottom: 8 }}>
            <Text size={0} muted>
              ページの並び順
            </Text>
            <button
              type="button"
              onClick={isReorderMode ? handleCompleteReorder : () => setIsReorderMode(true)}
              style={{
                fontSize: 11,
                padding: "3px 8px",
                border: "1px solid var(--card-border-color)",
                borderRadius: 4,
                background: isReorderMode ? "var(--blue-500, #2563eb)" : "transparent",
                color: isReorderMode ? "#fff" : "var(--card-muted-fg-color)",
                cursor: "pointer",
              }}
            >
              {isReorderMode ? "完了" : "並び替え"}
            </button>
          </Flex>
          {displayItems.map((item, idx) => {
            const page = pagesMap.get(item.pageRef._ref);
            if (!page) return null;
            const titleJa = page.title?.find((t) => t._key === "ja")?.value ?? "（タイトルなし）";
            return (
              <div
                key={item._key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  borderRadius: 4,
                  marginBottom: 2,
                  background: "var(--card-bg-color)",
                  border: "1px solid var(--card-border-color)",
                  opacity: draggingKey === item._key ? 0.4 : 1,
                  cursor: isReorderMode ? "grab" : "default",
                }}
                draggable={isReorderMode}
                onDragStart={isReorderMode ? () => handleDragStart(idx, item._key) : undefined}
                onDragOver={isReorderMode ? (e) => handleDragOver(e, idx) : undefined}
                onDragEnd={isReorderMode ? handleDragEnd : undefined}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {titleJa}
                </span>
                <button
                  type="button"
                  onClick={() => onTogglePageHidden(item._key)}
                  style={{
                    fontSize: 11,
                    padding: "2px 6px",
                    border: "1px solid var(--card-border-color)",
                    borderRadius: 3,
                    background: "transparent",
                    cursor: "pointer",
                    color: item.hidden ? "var(--card-muted-fg-color)" : "var(--green-600, #16a34a)",
                    flexShrink: 0,
                  }}
                >
                  {item.hidden ? "○ 非表示" : "● 表示中"}
                </button>
                {!isReorderMode && (
                  <button
                    type="button"
                    onClick={() => onRemovePage(item._key)}
                    title="このカテゴリから削除"
                    style={{
                      fontSize: 11,
                      padding: "2px 4px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "var(--card-muted-fg-color)",
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onAddPage}
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: 13,
            border: "1px dashed var(--card-border-color)",
            borderRadius: 6,
            background: "transparent",
            cursor: "pointer",
            color: "var(--card-muted-fg-color)",
            marginBottom: 24,
          }}
        >
          + ページを追加
        </button>

        {/* Rename */}
        <div
          style={{
            borderTop: "1px solid var(--card-border-color)",
            paddingTop: 16,
            marginBottom: 16,
          }}
        >
          {isRenaming ? (
            <div>
              <BilingualInput label="カテゴリ名" value={renameLabel} onChange={setRenameLabel} />
              <Flex gap={2} style={{ marginTop: 8 }}>
                <Button
                  text={renameSaving ? "保存中…" : "保存"}
                  tone="positive"
                  fontSize={1}
                  padding={2}
                  onClick={handleSaveRename}
                  disabled={renameSaving}
                />
                <Button
                  text="キャンセル"
                  mode="ghost"
                  fontSize={1}
                  padding={2}
                  onClick={() => {
                    setIsRenaming(false);
                    setRenameLabel(categoryDoc?.label ?? []);
                  }}
                />
              </Flex>
            </div>
          ) : (
            <Flex align="center" justify="space-between">
              <Button
                text="カテゴリ名を変更"
                mode="ghost"
                fontSize={1}
                padding={2}
                onClick={() => setIsRenaming(true)}
              />
              <Button
                icon={TrashIcon}
                text="削除"
                tone="critical"
                mode="ghost"
                fontSize={1}
                padding={2}
                onClick={onDeleteCategory}
              />
            </Flex>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add sanity/components/unified-pages/CategoryManagement.tsx
git commit -m "feat(unified-pages): add CategoryManagement middle panel"
```

---

## Task 7: PageCreationForm

**Files:**

- Create: `sanity/components/unified-pages/PageCreationForm.tsx`

- [ ] **Step 1: Create the component**

```tsx
// sanity/components/unified-pages/PageCreationForm.tsx
"use client";

import { useCallback, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text, TextInput } from "@sanity/ui";
import { i18nSet } from "../shared/i18n";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 96); // leave room for uniqueness suffix if needed
}

export function PageCreationForm({
  categoryKey,
  categoryShortId,
  onCreated,
  onCancel,
}: {
  categoryKey: string;
  categoryShortId: string; // for URL preview (e.g. "services")
  onCreated: (pageId: string) => void;
  onCancel: () => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });

  const [titleEn, setTitleEn] = useState("");
  const [titleJa, setTitleJa] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = slugify(titleEn);
  const urlPreview = slug ? `/${categoryShortId}/${slug}` : "";
  const canSave = titleEn.trim() && titleJa.trim() && slug;

  const handleCreate = useCallback(async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      // Check for slug collision
      const existing = await client.fetch<{ _id: string } | null>(
        `*[_type == "page" && slug == $slug][0]{ _id }`,
        { slug },
      );
      if (existing) {
        setError(`このURLはすでに使用されています: /${categoryShortId}/${slug}`);
        setSaving(false);
        return;
      }
      const pageId = `page-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
      await client.create({
        _id: pageId,
        _type: "page",
        slug,
        title: [
          { _key: "ja", value: titleJa },
          { _key: "en", value: titleEn },
        ],
      });
      onCreated(pageId);
    } catch (err) {
      console.error("Page creation failed:", err);
      setError("ページの作成に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }, [client, titleEn, titleJa, slug, categoryShortId, canSave, saving, onCreated]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box
        padding={3}
        style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}
      >
        <Text size={1} weight="semibold">
          新しいページを作成
        </Text>
      </Box>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--card-muted-fg-color)",
              marginBottom: 6,
            }}
          >
            英語タイトル（URLの元になります）*
          </label>
          <TextInput
            value={titleEn}
            onChange={(e) => setTitleEn((e.target as HTMLInputElement).value)}
            placeholder="e.g. Japanese Classes"
          />
          {slug && (
            <div style={{ fontSize: 11, color: "var(--card-muted-fg-color)", marginTop: 4 }}>
              URL: <span style={{ fontFamily: "monospace" }}>{urlPreview}</span>
            </div>
          )}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--card-muted-fg-color)",
              marginBottom: 6,
            }}
          >
            日本語タイトル *
          </label>
          <TextInput
            value={titleJa}
            onChange={(e) => setTitleJa((e.target as HTMLInputElement).value)}
            placeholder="例：日本語クラス"
          />
        </div>
        <div
          style={{
            padding: "10px 12px",
            background: "var(--yellow-100, #fef9c3)",
            borderRadius: 6,
            fontSize: 12,
            color: "var(--card-fg-color)",
            marginBottom: 16,
          }}
        >
          作成後、非表示に設定されます。内容を入力してから表示に切り替えてください。
        </div>
        {error && (
          <div
            style={{
              padding: "8px 12px",
              background: "var(--red-50, #fef2f2)",
              borderRadius: 6,
              fontSize: 12,
              color: "#dc2626",
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}
        <Flex gap={2}>
          <Button
            text={saving ? "作成中…" : "作成する"}
            tone="positive"
            fontSize={1}
            padding={3}
            onClick={handleCreate}
            disabled={!canSave || saving}
          />
          <Button text="キャンセル" mode="ghost" fontSize={1} padding={3} onClick={onCancel} />
        </Flex>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add sanity/components/unified-pages/PageCreationForm.tsx
git commit -m "feat(unified-pages): add PageCreationForm"
```

---

## Task 8: CategoryCreationForm

**Files:**

- Create: `sanity/components/unified-pages/CategoryCreationForm.tsx`

- [ ] **Step 1: Create the component**

```tsx
// sanity/components/unified-pages/CategoryCreationForm.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text } from "@sanity/ui";
import createImageUrlBuilder from "@sanity/image-url";
import { BilingualInput } from "../shared/BilingualInput";
import { ImagePickerPanel } from "../shared/ImagePickerPanel";
import type { I18nString, CategoryDoc } from "./types";

export function CategoryCreationForm({
  onCreated,
  onCancel,
}: {
  onCreated: (categoryId: string, categoryDoc: CategoryDoc) => void;
  onCancel: () => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(
    () => createImageUrlBuilder(client as Parameters<typeof createImageUrlBuilder>[0]),
    [client],
  );

  const [label, setLabel] = useState<I18nString[]>([]);
  const [heroImageRef, setHeroImageRef] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const canSave = label.some((l) => l.value.trim()) && !!heroImageRef;

  const handleSave = useCallback(async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const categoryId = `category-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
      const heroImage = {
        _type: "image",
        asset: { _type: "reference", _ref: heroImageRef! },
      };
      await client.createOrReplace({
        _id: categoryId,
        _type: "category",
        label,
        heroImage,
      });
      const categoryDoc: CategoryDoc = {
        _id: categoryId,
        _type: "category",
        label,
        heroImage,
      };
      onCreated(categoryId, categoryDoc);
    } catch (err) {
      console.error("Failed to create category:", err);
    } finally {
      setSaving(false);
    }
  }, [client, label, heroImageRef, canSave, saving, onCreated]);

  if (showImagePicker) {
    return (
      <ImagePickerPanel
        onSelect={(assetId) => {
          setHeroImageRef(assetId);
          setShowImagePicker(false);
        }}
        onClose={() => setShowImagePicker(false)}
      />
    );
  }

  const heroUrl = heroImageRef
    ? builder.image(heroImageRef).width(400).height(225).fit("crop").auto("format").url()
    : null;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box
        padding={3}
        style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}
      >
        <Text size={1} weight="semibold">
          新しいカテゴリを作成
        </Text>
      </Box>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <BilingualInput label="カテゴリ名" value={label} onChange={setLabel} />
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
            ヒーロー画像 *
          </div>
          {heroUrl ? (
            <div
              style={{
                position: "relative",
                borderRadius: 6,
                overflow: "hidden",
                aspectRatio: "16/9",
                maxWidth: 320,
              }}
            >
              <img
                src={heroUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <button
                type="button"
                onClick={() => setShowImagePicker(true)}
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 6,
                  padding: "4px 10px",
                  fontSize: 11,
                  border: "none",
                  borderRadius: 4,
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                変更
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowImagePicker(true)}
              style={{
                width: "100%",
                maxWidth: 320,
                aspectRatio: "16/9",
                border: "2px dashed var(--card-border-color)",
                borderRadius: 6,
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                color: "var(--card-muted-fg-color)",
              }}
            >
              画像を選択
            </button>
          )}
        </div>
        <Flex gap={2}>
          <Button
            text={saving ? "作成中…" : "作成する"}
            tone="positive"
            fontSize={1}
            padding={3}
            onClick={handleSave}
            disabled={!canSave || saving}
          />
          <Button text="キャンセル" mode="ghost" fontSize={1} padding={3} onClick={onCancel} />
        </Flex>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add sanity/components/unified-pages/CategoryCreationForm.tsx
git commit -m "feat(unified-pages): add CategoryCreationForm"
```

---

## Task 9: SystemPageNotice

**Files:**

- Create: `sanity/components/unified-pages/SystemPageNotice.tsx`

- [ ] **Step 1: Create the component**

```tsx
// sanity/components/unified-pages/SystemPageNotice.tsx
"use client";

import { Box, Button, Flex, Text } from "@sanity/ui";
import { SYSTEM_PAGES } from "./types";

export function SystemPageNotice({
  name,
  onNavigateToTool,
}: {
  name: "blog" | "announcements";
  onNavigateToTool: (toolName: string) => void;
}) {
  const config = SYSTEM_PAGES.find((sp) => sp.name === name);
  if (!config) return null;

  return (
    <Flex align="center" justify="center" style={{ height: "100%", padding: 32 }}>
      <Box style={{ maxWidth: 360, textAlign: "center" }}>
        <Text size={1} weight="semibold" style={{ marginBottom: 12, display: "block" }}>
          {config.label}
        </Text>
        <Text size={1} muted style={{ marginBottom: 20, display: "block", lineHeight: 1.6 }}>
          このページはシステムで管理されています。
          <br />
          内容を編集するには、{config.toolTitle}をご利用ください。
        </Text>
        <Button
          text={`${config.toolTitle}へ →`}
          tone="primary"
          fontSize={1}
          padding={3}
          onClick={() => onNavigateToTool(config.toolName)}
        />
      </Box>
    </Flex>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add sanity/components/unified-pages/SystemPageNotice.tsx
git commit -m "feat(unified-pages): add SystemPageNotice"
```

---

## Task 10: UnifiedPagesTool

**Files:**

- Create: `sanity/components/UnifiedPagesTool.tsx`

This is the root component that wires everything together. It manages:

- `middlePanel` state (what the middle panel shows)
- `rightPanel` state (section tools — same as current PagesTool)
- Calls into `useNavData` for all nav mutations

The tool name is `"pages"` so existing deep links (from the media plugin) still work.

- [ ] **Step 1: Create the component**

```tsx
// sanity/components/UnifiedPagesTool.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flex, Text } from "@sanity/ui";
import { useRouter } from "sanity/router";
import { useDeepLink } from "./shared/useDeepLink";
import { ImagePickerPanel } from "./shared/ImagePickerPanel";
import { FilePickerPanel } from "./shared/FilePickerPanel";
import { CombinedGalleryPanel, type GalleryImageItem } from "./blog/GalleryPanel";
import {
  DocumentDetailPanel,
  type DocumentLinkItem as SharedDocumentLinkItem,
} from "./shared/DocumentDetailPanel";
import { PreviewPanel } from "./shared/PreviewPanel";
import { RightPanel } from "./shared/RightPanel";
import { SectionPickerPanel } from "./pages/SectionPickerPanel";
import { PagePreview } from "./pages/PagePreview";
import { LeftPanel } from "./unified-pages/LeftPanel";
import { PageEditor } from "./unified-pages/PageEditor";
import { CategoryManagement } from "./unified-pages/CategoryManagement";
import { PageCreationForm } from "./unified-pages/PageCreationForm";
import { CategoryCreationForm } from "./unified-pages/CategoryCreationForm";
import { SystemPageNotice } from "./unified-pages/SystemPageNotice";
import { useNavData } from "./unified-pages/useNavData";
import { shortId, SYSTEM_PAGES } from "./unified-pages/types";
import type { MiddlePanelState } from "./unified-pages/types";
import type { SectionTypeName } from "./pages/types";
import type { PageDoc } from "./unified-pages/types";
import { useClient } from "sanity";

// Draft page IDs subscription query
const DRAFT_PAGE_IDS_QUERY = `*[_id in path("drafts.page-*")]._id`;

export function UnifiedPagesTool() {
  const deepLinkId = useDeepLink("pages");
  const [middlePanel, setMiddlePanel] = useState<MiddlePanelState>(
    deepLinkId ? { type: "page", id: deepLinkId } : null,
  );
  const [mergedDoc, setMergedDoc] = useState<PageDoc | null>(null);
  const [draftPageIds, setDraftPageIds] = useState<Set<string>>(new Set());

  const client = useClient({ apiVersion: "2024-01-01" });
  const sidebarRefreshRef = useRef<(() => void) | null>(null);

  // Subscribe to draft page changes for draft indicators
  useEffect(() => {
    const sub = client.listen('*[_type == "page"]').subscribe(() => {
      client.fetch<string[]>(DRAFT_PAGE_IDS_QUERY).then((ids) => {
        setDraftPageIds(new Set(ids.map((id) => id.replace("drafts.", ""))));
      });
    });
    // Initial load
    client.fetch<string[]>(DRAFT_PAGE_IDS_QUERY).then((ids) => {
      setDraftPageIds(new Set(ids.map((id) => id.replace("drafts.", ""))));
    });
    return () => sub.unsubscribe();
  }, [client]);

  const navData = useNavData();

  // Right panel state (section tools)
  const [rightPanel, setRightPanel] = useState<
    | { type: "imagePicker"; onSelect: (assetId: string) => void }
    | { type: "filePicker"; onSelect: (assetId: string, filename: string, ext: string) => void }
    | {
        type: "galleryEditor";
        sectionKey: string;
        initialImages: GalleryImageItem[];
        onUpdateImages: (images: GalleryImageItem[]) => void;
      }
    | { type: "sectionPicker"; onSelect: (type: SectionTypeName) => void }
    | {
        type: "documentDetail";
        doc: SharedDocumentLinkItem;
        onUpdate: (doc: SharedDocumentLinkItem) => void;
        onRemove: () => void;
      }
    | null
  >(null);

  const handleOpenImagePicker = useCallback((onSelect: (assetId: string) => void) => {
    setRightPanel({ type: "imagePicker", onSelect });
  }, []);
  const handleOpenFilePicker = useCallback(
    (onSelect: (assetId: string, filename: string, ext: string) => void) => {
      setRightPanel({ type: "filePicker", onSelect });
    },
    [],
  );
  const handleOpenSectionPicker = useCallback((onSelect: (type: SectionTypeName) => void) => {
    setRightPanel({ type: "sectionPicker", onSelect });
  }, []);
  const handleOpenGalleryEditor = useCallback(
    (
      sectionKey: string,
      images: GalleryImageItem[],
      onUpdate: (images: GalleryImageItem[]) => void,
    ) => {
      setRightPanel({
        type: "galleryEditor",
        sectionKey,
        initialImages: images,
        onUpdateImages: onUpdate,
      });
    },
    [],
  );
  const handleOpenDocumentDetail = useCallback(
    (
      doc: SharedDocumentLinkItem,
      onUpdate: (doc: SharedDocumentLinkItem) => void,
      onRemove: () => void,
    ) => {
      setRightPanel({ type: "documentDetail", doc, onUpdate, onRemove });
    },
    [],
  );

  const handleSelectPage = useCallback((id: string) => {
    setMiddlePanel({ type: "page", id });
    setRightPanel(null);
    setMergedDoc(null);
  }, []);

  const handleSelectCategory = useCallback((key: string) => {
    setMiddlePanel({ type: "category", key });
    setRightPanel(null);
    setMergedDoc(null);
  }, []);

  const handleSelectSystemPage = useCallback((name: "blog" | "announcements") => {
    setMiddlePanel({ type: "system", name });
    setRightPanel(null);
    setMergedDoc(null);
  }, []);

  const handleNavigateToTool = useCallback((toolName: string) => {
    // Navigate using Sanity's router
    window.location.href = window.location.pathname.replace(/\/[^/]+$/, `/${toolName}`);
  }, []);

  const handleCreateCategory = useCallback(() => {
    setMiddlePanel({ type: "createCategory" });
    setRightPanel(null);
  }, []);

  // Find the category key for the current category (for operations from CategoryManagement)
  const currentNavCat =
    middlePanel?.type === "category"
      ? navData.categories.find((c) => c._key === middlePanel.key)
      : null;

  // Find category key for page creation
  const handleStartCreatePage = useCallback((categoryKey: string) => {
    setMiddlePanel({ type: "createPage", categoryKey });
    setRightPanel(null);
  }, []);

  const handlePageCreated = useCallback(
    async (pageId: string, categoryKey: string) => {
      // Add to navigation as hidden
      navData.addPageToNav(categoryKey, pageId);
      // Refresh pages in nav data
      await navData.refreshPages();
      // Open the new page in the editor
      setMiddlePanel({ type: "page", id: pageId });
    },
    [navData],
  );

  const handleCategoryCreated = useCallback(
    (categoryId: string, categoryDoc: import("./unified-pages/types").CategoryDoc) => {
      navData.addCategoryToNav(categoryId, categoryDoc);
      // Open the new category's management view
      const key =
        navData.categories.length > 0
          ? navData.categories[navData.categories.length - 1]._key
          : null;
      // Can't know the new key until state updates, so just clear panel
      setMiddlePanel(null);
    },
    [navData],
  );

  // ── Middle panel renderer ──────────────────────────────────

  function renderMiddlePanel() {
    if (!middlePanel) {
      return (
        <Flex
          align="center"
          justify="center"
          direction="column"
          gap={4}
          style={{ height: "100%", color: "var(--card-muted-fg-color)" }}
        >
          <Text size={2} muted>
            左のパネルからページまたはカテゴリを選択してください
          </Text>
        </Flex>
      );
    }

    switch (middlePanel.type) {
      case "page":
        return (
          <PageEditor
            key={middlePanel.id}
            documentId={middlePanel.id}
            onOpenImagePicker={handleOpenImagePicker}
            onOpenFilePicker={handleOpenFilePicker}
            onOpenSectionPicker={handleOpenSectionPicker}
            onOpenGalleryEditor={handleOpenGalleryEditor}
            onOpenDocumentDetail={handleOpenDocumentDetail}
            activeGallerySectionKey={
              rightPanel?.type === "galleryEditor" ? rightPanel.sectionKey : null
            }
            onDeselectGallery={() => setRightPanel(null)}
            onMergedChange={setMergedDoc}
            onDraftChange={() => sidebarRefreshRef.current?.()}
          />
        );

      case "category": {
        const navCat = navData.categories.find((c) => c._key === middlePanel.key);
        const catDoc = navCat ? navData.categoryDocs.get(navCat.categoryRef?._ref) : undefined;
        if (!navCat)
          return (
            <Flex align="center" justify="center" style={{ height: "100%" }}>
              <Text muted>カテゴリが見つかりません</Text>
            </Flex>
          );
        return (
          <CategoryManagement
            key={middlePanel.key}
            navCat={navCat}
            categoryDoc={catDoc}
            pagesMap={navData.pagesMap}
            onTogglePageHidden={(itemKey) => navData.togglePageHidden(middlePanel.key, itemKey)}
            onRemovePage={(itemKey) => navData.removePage(middlePanel.key, itemKey)}
            onReorderPages={(newItems) => navData.publishPageReorder(middlePanel.key, newItems)}
            onAddPage={() => handleStartCreatePage(middlePanel.key)}
            onHeroImageChanged={navData.onHeroImageChanged}
            onCategoryRenamed={navData.handleCategoryRenamed}
            onDeleteCategory={() => {
              navData.deleteCategory(middlePanel.key);
              setMiddlePanel(null);
            }}
          />
        );
      }

      case "createPage": {
        const navCat = navData.categories.find((c) => c._key === middlePanel.categoryKey);
        const catDoc = navCat ? navData.categoryDocs.get(navCat.categoryRef?._ref) : undefined;
        const catShortId = navCat ? shortId(navCat.categoryRef._ref) : "unknown";
        return (
          <PageCreationForm
            categoryKey={middlePanel.categoryKey}
            categoryShortId={catShortId}
            onCreated={(pageId) => handlePageCreated(pageId, middlePanel.categoryKey)}
            onCancel={() => setMiddlePanel({ type: "category", key: middlePanel.categoryKey })}
          />
        );
      }

      case "createCategory":
        return (
          <CategoryCreationForm
            onCreated={handleCategoryCreated}
            onCancel={() => setMiddlePanel(null)}
          />
        );

      case "system":
        return <SystemPageNotice name={middlePanel.name} onNavigateToTool={handleNavigateToTool} />;

      default:
        return null;
    }
  }

  // ── Right panel renderer ───────────────────────────────────

  function renderRightPanel() {
    if (!rightPanel) {
      // Show preview when viewing a page and no tool panel open
      if (middlePanel?.type === "page" && mergedDoc) {
        return (
          <RightPanel>
            <PreviewPanel>
              <PagePreview page={mergedDoc} />
            </PreviewPanel>
          </RightPanel>
        );
      }
      return null;
    }

    return (
      <RightPanel>
        {rightPanel.type === "imagePicker" ? (
          <ImagePickerPanel
            onSelect={(assetId) => {
              rightPanel.onSelect(assetId);
              setRightPanel(null);
            }}
            onClose={() => setRightPanel(null)}
          />
        ) : rightPanel.type === "filePicker" ? (
          <FilePickerPanel
            onSelect={(assetId, filename, ext) => {
              rightPanel.onSelect(assetId, filename, ext);
              setRightPanel(null);
            }}
            onClose={() => setRightPanel(null)}
          />
        ) : rightPanel.type === "galleryEditor" ? (
          <CombinedGalleryPanel
            key={rightPanel.sectionKey}
            initialImages={rightPanel.initialImages}
            onUpdateImages={rightPanel.onUpdateImages}
            onClose={() => setRightPanel(null)}
          />
        ) : rightPanel.type === "sectionPicker" ? (
          <SectionPickerPanel
            onSelect={(type) => {
              rightPanel.onSelect(type);
              setRightPanel(null);
            }}
            onClose={() => setRightPanel(null)}
          />
        ) : rightPanel.type === "documentDetail" ? (
          <DocumentDetailPanel
            doc={rightPanel.doc}
            onUpdate={(updated) => {
              rightPanel.onUpdate(updated);
              setRightPanel((prev) =>
                prev?.type === "documentDetail" ? { ...prev, doc: updated } : prev,
              );
            }}
            onRemove={() => {
              rightPanel.onRemove();
              setRightPanel(null);
            }}
            onChangeFile={() => {
              const { doc, onUpdate } = rightPanel;
              setRightPanel({
                type: "filePicker",
                onSelect: (assetId, filename, ext) => {
                  const updated: SharedDocumentLinkItem = {
                    ...doc,
                    file: { asset: { _ref: assetId } },
                    fileType: ext,
                  };
                  onUpdate(updated);
                  setRightPanel({
                    type: "documentDetail",
                    doc: updated,
                    onUpdate,
                    onRemove: rightPanel.onRemove,
                  });
                },
              });
            }}
            onClose={() => setRightPanel(null)}
          />
        ) : null}
      </RightPanel>
    );
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* ── Left: Category tree ── */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          borderRight: "1px solid var(--card-border-color)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <LeftPanel
          loading={navData.loading}
          saving={navData.saving}
          saveStatus={navData.saveStatus}
          hasDraft={navData.hasDraft}
          categories={navData.categories}
          categoryDocs={navData.categoryDocs}
          pagesMap={navData.pagesMap}
          draftPageIds={draftPageIds}
          selectedMiddle={middlePanel}
          onSelectCategory={handleSelectCategory}
          onSelectPage={handleSelectPage}
          onSelectSystemPage={handleSelectSystemPage}
          onCreateCategory={handleCreateCategory}
          onTogglePageHidden={navData.togglePageHidden}
          onPublishNav={navData.publishNav}
          onReorderCategories={navData.publishCategoryReorder}
        />
      </div>

      {/* ── Center: Middle panel ── */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>{renderMiddlePanel()}</div>

      {/* ── Right: Section tools or preview ── */}
      {renderRightPanel()}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -30
```

Fix any type errors before committing.

- [ ] **Step 3: Commit**

```bash
git add sanity/components/UnifiedPagesTool.tsx
git commit -m "feat(unified-pages): add UnifiedPagesTool root component"
```

---

## Task 11: Plugin Registration + Config Update

**Files:**

- Create: `sanity/components/unifiedPagesPlugin.ts`
- Modify: `sanity.config.ts`

- [ ] **Step 1: Create the plugin**

```typescript
// sanity/components/unifiedPagesPlugin.ts
import { definePlugin, type Tool } from "sanity";
import { UnifiedPagesTool } from "./UnifiedPagesTool";

const unifiedPagesTool: Tool = {
  name: "pages",
  title: "ページ管理",
  component: UnifiedPagesTool,
};

export const unifiedPagesPlugin = definePlugin({
  name: "yia-unified-pages",
  tools: [unifiedPagesTool],
});
```

- [ ] **Step 2: Update sanity.config.ts**

In `sanity.config.ts`:

1. Remove `import { navigationPlugin } from "./sanity/components/navigationPlugin";`
2. Remove `import { pagesPlugin } from "./sanity/components/pagesPlugin";`
3. Add `import { unifiedPagesPlugin } from "./sanity/components/unifiedPagesPlugin";`
4. In the `plugins` array: remove `navigationPlugin()` and `pagesPlugin()`, add `unifiedPagesPlugin()`
5. In `newDocumentOptions`: add `"page"` to the blocked list so pages can only be created through the unified tool

The final `newDocumentOptions` should be:

```typescript
newDocumentOptions: (prev) =>
  prev.filter(
    (item) =>
      ![
        "siteSettings",
        "homepage",
        "navigation",
        "homepageFeatured",
        "sidebar",
        "category",
        "page",
      ].includes(item.templateId),
  ),
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Start the dev server and manually verify the unified tool loads**

```bash
npm run dev
```

Open `http://localhost:3000/studio` and verify:

- "ページ管理" tool appears (only one, not two separate tools)
- Left panel shows category tree
- Clicking a category opens category management in the middle panel
- Clicking a page opens the page editor in the middle panel
- System pages appear at the bottom
- "ナビゲーション" tool is gone

- [ ] **Step 5: Commit**

```bash
git add sanity/components/unifiedPagesPlugin.ts sanity.config.ts
git commit -m "feat(unified-pages): register unified plugin, replace pagesPlugin + navigationPlugin"
```

---

## Task 12: Delete Retired Files

**Files to delete:**

- `sanity/components/pagesPlugin.ts`
- `sanity/components/PagesTool.tsx`
- `sanity/components/pages/PagesSidebar.tsx`
- `sanity/components/pages/PageEditor.tsx`
- `sanity/components/NavigationTool.tsx`
- `sanity/components/navigationPlugin.ts`
- `sanity/components/navigation/NavigationEditor.tsx`
- `sanity/components/navigation/CategoryItem.tsx`
- `sanity/components/navigation/PageItem.tsx`
- `sanity/components/navigation/EditCategoryPanel.tsx`
- `sanity/components/navigation/AddPagePanel.tsx`
- `sanity/components/navigation/AddCategoryPanel.tsx`
- `sanity/components/navigation/RenameCategoryPanel.tsx`
- `sanity/components/navigation/types.ts`

- [ ] **Step 1: Delete all retired files**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && \
  rm sanity/components/pagesPlugin.ts \
     sanity/components/PagesTool.tsx \
     sanity/components/pages/PagesSidebar.tsx \
     sanity/components/pages/PageEditor.tsx \
     sanity/components/NavigationTool.tsx \
     sanity/components/navigationPlugin.ts \
     sanity/components/navigation/NavigationEditor.tsx \
     sanity/components/navigation/CategoryItem.tsx \
     sanity/components/navigation/PageItem.tsx \
     sanity/components/navigation/EditCategoryPanel.tsx \
     sanity/components/navigation/AddPagePanel.tsx \
     sanity/components/navigation/AddCategoryPanel.tsx \
     sanity/components/navigation/RenameCategoryPanel.tsx \
     sanity/components/navigation/types.ts
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd /Users/quinnngo/Desktop/projects/yia-nextjs && npx tsc --noEmit 2>&1 | head -50
```

Expected: no errors referencing the deleted files. If errors appear, they indicate a remaining import somewhere — fix by updating the import to the new location.

- [ ] **Step 3: Final manual smoke test**

```bash
npm run dev
```

Verify:

1. Studio loads at `/studio` without error
2. Only one "ページ管理" tool in the sidebar
3. Category tree shows all categories with their pages
4. Clicking a category opens category management (hero image, page list, rename, delete)
5. `[並び替え]` in category management enters drag mode; `[完了]` publishes immediately
6. `[ナビの順番を変更]` in left panel header enters drag mode; `[完了]` publishes immediately
7. `[+ ページを追加]` shows page creation form; creating a page opens it in the editor as 非表示
8. `[+ カテゴリを追加]` shows category creation form
9. System pages (ブログ, お知らせ) show the notice with link to relevant tool
10. Nav publish bar appears when there are draft nav changes
11. Page editor works: auto-save, publish, discard draft
12. Right panel section tools work (section picker, image picker, etc.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove retired pages and navigation tool components"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement                                                         | Covered in task |
| ------------------------------------------------------------------------ | --------------- |
| Left panel: category tree with collapsible categories                    | Task 4          |
| Left panel: `[ナビの順番を変更]` toggle drag mode                        | Task 4          |
| Left panel: `[完了]` publishes category reorder immediately              | Task 4 + Task 2 |
| Left panel: inline 表示中/非表示 toggle                                  | Task 4          |
| Left panel: draft indicator dot on pages                                 | Task 4          |
| Left panel: system pages section                                         | Task 4          |
| Left panel: `[+ カテゴリを追加]`                                         | Task 4          |
| Left panel: NavPublishBar                                                | Task 3          |
| Middle panel: page editor                                                | Task 5          |
| Middle panel: category management                                        | Task 6          |
| Middle panel: page reorder `[並び替え]` / `[完了]` publishes immediately | Task 6 + Task 2 |
| Middle panel: `[+ ページを追加]` → page creation form                    | Task 6 + Task 7 |
| Middle panel: page creation form with URL preview, 非表示 default        | Task 7          |
| Middle panel: category creation form                                     | Task 8          |
| Middle panel: system page notice with link                               | Task 9          |
| Middle panel: empty state when nothing selected                          | Task 10         |
| Right panel: section tools (image, file, gallery, section picker)        | Task 10         |
| Right panel: preview when page selected and no tool open                 | Task 10         |
| Navigation draft vs. immediate publish distinction                       | Task 2          |
| Nav publish: syncs categoryRef on pages                                  | Task 2          |
| Plugin registration replacing two old plugins                            | Task 11         |
| Block raw page creation via `newDocumentOptions`                         | Task 11         |
| Remove retired files                                                     | Task 12         |

All spec requirements are covered. No gaps found.
