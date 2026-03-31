# Studio Navigation Plugin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a custom Sanity Studio navigation tool that lets admins manage site navigation categories and pages through a two-pane interface with drag-and-drop reorder, visibility toggles, and category CRUD — replacing raw Sanity form editing.

**Architecture:** Standalone Sanity Studio plugin registered as a sidebar tool. Left pane shows the bird's-eye overview (expandable category rows with page lists). Right pane is a contextual workspace for add-page, reorder, add-category, and rename-category operations. Edits auto-save to a draft via debounced writes; publish syncs page `categoryRef` fields. Follows the established `HomepageTool.tsx` / `HomepageEditor.tsx` pattern.

**Tech Stack:** Sanity v3 plugin API, React, `@sanity/ui`, `@sanity/icons`, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-31-studio-navigation-plugin-design.md`

**Branch:** Start fresh from `main` on `feature/wave2-nav-plugin-v2` (existing `feature/wave2-nav-plugin` is stale)

---

## File Structure

| File                                                   | Responsibility                                                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `sanity/components/navigation/types.ts`                | **Create** — TypeScript interfaces for navigation data, state, and callbacks              |
| `sanity/components/navigationPlugin.ts`                | **Create** — Plugin definition (tool registration)                                        |
| `sanity/components/NavigationTool.tsx`                 | **Create** — Two-pane wrapper with right-panel state machine                              |
| `sanity/components/navigation/NavigationEditor.tsx`    | **Create** — Left pane: data loading, state management, auto-save, publish, category list |
| `sanity/components/navigation/CategoryItem.tsx`        | **Create** — Expandable category row: page list, visibility toggles, ⋯ menu               |
| `sanity/components/navigation/PageItem.tsx`            | **Create** — Single page row: title + visibility button                                   |
| `sanity/components/navigation/AddPagePanel.tsx`        | **Create** — Right pane: unassigned page picker                                           |
| `sanity/components/navigation/ReorderPagesPanel.tsx`   | **Create** — Right pane: arrow-based page reorder                                         |
| `sanity/components/navigation/AddCategoryPanel.tsx`    | **Create** — Right pane: bilingual label + hero image form                                |
| `sanity/components/navigation/RenameCategoryPanel.tsx` | **Create** — Right pane: bilingual label edit                                             |
| `sanity.config.ts`                                     | **Modify** — Register `navigationPlugin`                                                  |

---

### Task 1: Types

**Files:**

- Create: `sanity/components/navigation/types.ts`

- [ ] **Step 1: Create the types file**

```ts
// sanity/components/navigation/types.ts
import type { I18nString, ImageField } from "../homepage/types";

// ── Raw Sanity document shapes ──────────────────────

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

// ── Denormalized data for UI ────────────────────────

export interface CategoryDoc {
  _id: string;
  _type: "category";
  label?: I18nString[];
  description?: I18nString[];
  heroImage?: ImageField;
}

export interface PageDoc {
  _id: string;
  _type: "page";
  title?: I18nString[];
  slug?: string;
  categoryRef?: { _ref: string };
}

// ── Right panel state machine ───────────────────────

export type RightPanelState =
  | null
  | { type: "addPage"; categoryKey: string }
  | { type: "reorderPages"; categoryKey: string }
  | { type: "addCategory" }
  | { type: "renameCategory"; categoryKey: string };

// ── Callback types ──────────────────────────────────

export type OnOpenRightPanel = (panel: RightPanelState) => void;

export type OnUpdateCategories = (categories: NavCategoryRaw[]) => void;
```

- [ ] **Step 2: Commit**

```bash
git add sanity/components/navigation/types.ts
git commit -m "Add TypeScript types for navigation plugin"
```

---

### Task 2: Plugin scaffold and registration

**Files:**

- Create: `sanity/components/navigationPlugin.ts`
- Modify: `sanity.config.ts:7-8,18-19`

- [ ] **Step 1: Create plugin definition**

```ts
// sanity/components/navigationPlugin.ts
import { definePlugin, type Tool } from "sanity";
import { NavigationTool } from "./NavigationTool";

const navigationTool: Tool = {
  name: "navigation",
  title: "ナビゲーション",
  component: NavigationTool,
};

export const navigationPlugin = definePlugin({
  name: "yia-navigation",
  tools: [navigationTool],
});
```

- [ ] **Step 2: Register in sanity.config.ts**

Add import after line 7 (`import { homepagePlugin } from "./sanity/components/homepagePlugin";`):

```ts
import { navigationPlugin } from "./sanity/components/navigationPlugin";
```

Add to plugins array after `homepagePlugin()` (line 19):

```ts
plugins: [
  homepagePlugin(),
  navigationPlugin(),
  announcementsPlugin(),
```

- [ ] **Step 3: Create a stub NavigationTool so TypeScript is satisfied**

```ts
// sanity/components/NavigationTool.tsx
"use client";

export function NavigationTool() {
  return <div style={{ padding: 20 }}>Navigation Tool — scaffold</div>;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

Expected: PASS (no errors)

- [ ] **Step 5: Commit**

```bash
git add sanity/components/navigationPlugin.ts sanity/components/NavigationTool.tsx sanity.config.ts
git commit -m "Register navigation plugin scaffold in Studio"
```

---

### Task 3: PageItem component

**Files:**

- Create: `sanity/components/navigation/PageItem.tsx`

- [ ] **Step 1: Create PageItem**

```tsx
// sanity/components/navigation/PageItem.tsx
"use client";

import { i18nGet } from "../shared/i18n";
import type { I18nString } from "../homepage/types";

export function PageItem({
  title,
  hidden,
  onToggleHidden,
}: {
  title: I18nString[] | undefined;
  hidden: boolean;
  onToggleHidden: () => void;
}) {
  const ja = i18nGet(title, "ja") || "Untitled";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 0 6px 24px",
        opacity: hidden ? 0.45 : 1,
      }}
    >
      <span
        style={{
          fontSize: 13,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}
      >
        {ja}
      </span>
      <button
        type="button"
        onClick={onToggleHidden}
        style={{
          fontSize: 11,
          padding: "2px 8px",
          border: "1px solid var(--card-border-color)",
          borderRadius: 4,
          background: hidden
            ? "var(--card-bg-color)"
            : "var(--card-badge-default-bg-color, #e6f0e6)",
          color: hidden
            ? "var(--card-muted-fg-color)"
            : "var(--card-badge-default-fg-color, #2d6a2d)",
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
          marginLeft: 8,
        }}
      >
        {hidden ? "非表示" : "表示中"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add sanity/components/navigation/PageItem.tsx
git commit -m "Add PageItem component with visibility toggle button"
```

---

### Task 4: CategoryItem component

**Files:**

- Create: `sanity/components/navigation/CategoryItem.tsx`

This component renders a single category row (collapsed/expanded) with:

- Expand/collapse toggle
- Category label (JA / EN)
- Page count
- ⋯ menu (Rename, Delete)
- When expanded: page list with PageItem components + action buttons

- [ ] **Step 1: Create CategoryItem**

```tsx
// sanity/components/navigation/CategoryItem.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { i18nGet } from "../shared/i18n";
import { PageItem } from "./PageItem";
import type { NavCategoryRaw, NavItemRaw, CategoryDoc, PageDoc, RightPanelState } from "./types";

export function CategoryItem({
  navCategory,
  categoryDoc,
  pagesMap,
  expanded,
  onToggleExpand,
  onTogglePageHidden,
  onRemovePage,
  onOpenPanel,
  onDeleteCategory,
  // Drag props
  draggable,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}: {
  navCategory: NavCategoryRaw;
  categoryDoc: CategoryDoc | undefined;
  pagesMap: Map<string, PageDoc>;
  expanded: boolean;
  onToggleExpand: () => void;
  onTogglePageHidden: (itemKey: string) => void;
  onRemovePage: (itemKey: string) => void;
  onOpenPanel: (panel: RightPanelState) => void;
  onDeleteCategory: () => void;
  draggable: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const labelJa = i18nGet(categoryDoc?.label, "ja") || "Untitled";
  const labelEn = i18nGet(categoryDoc?.label, "en");
  const pageCount = navCategory.items?.length ?? 0;

  const handleMenuAction = useCallback(
    (action: "rename" | "delete") => {
      setMenuOpen(false);
      if (action === "rename") {
        onOpenPanel({ type: "renameCategory", categoryKey: navCategory._key });
      } else {
        onDeleteCategory();
      }
    },
    [navCategory._key, onOpenPanel, onDeleteCategory],
  );

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
      }}
      onDragEnd={onDragEnd}
      style={{
        borderBottom: "1px solid var(--card-border-color)",
        opacity: isDragging ? 0.4 : 1,
        background: isDragging ? "var(--card-bg2-color, #f5f5f5)" : undefined,
      }}
    >
      {/* Category header row */}
      <div
        onClick={onToggleExpand}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 12px",
          cursor: "pointer",
          userSelect: "none",
          gap: 8,
        }}
      >
        {/* Drag handle + expand arrow */}
        <span
          style={{
            fontSize: 11,
            color: "var(--card-muted-fg-color)",
            width: 16,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {expanded ? "▼" : "▶"}
        </span>

        {/* Label */}
        <span
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {labelJa}
          {labelEn && (
            <span
              style={{
                fontWeight: 400,
                color: "var(--card-muted-fg-color)",
                marginLeft: 6,
                fontSize: 12,
              }}
            >
              / {labelEn}
            </span>
          )}
        </span>

        {/* Page count */}
        <span style={{ fontSize: 11, color: "var(--card-muted-fg-color)", flexShrink: 0 }}>
          {pageCount} {pageCount === 1 ? "page" : "pages"}
        </span>

        {/* ⋯ menu button */}
        <div style={{ position: "relative", flexShrink: 0 }} ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 16,
              padding: "0 4px",
              color: "var(--card-muted-fg-color)",
              lineHeight: 1,
            }}
          >
            ⋯
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "100%",
                zIndex: 10,
                background: "var(--card-bg-color)",
                border: "1px solid var(--card-border-color)",
                borderRadius: 6,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                minWidth: 140,
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuAction("rename");
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 12px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 13,
                  textAlign: "left",
                  color: "var(--card-fg-color)",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = "var(--card-bg2-color, #f5f5f5)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = "transparent";
                }}
              >
                名前を変更
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuAction("delete");
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 12px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 13,
                  textAlign: "left",
                  color: "#cc3333",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = "var(--card-bg2-color, #f5f5f5)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = "transparent";
                }}
              >
                削除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded page list */}
      {expanded && (
        <div style={{ padding: "0 12px 10px" }}>
          {(navCategory.items ?? []).map((item) => {
            const pageDoc = pagesMap.get(item.pageRef?._ref);
            return (
              <div key={item._key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <PageItem
                    title={pageDoc?.title}
                    hidden={!!item.hidden}
                    onToggleHidden={() => onTogglePageHidden(item._key)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemovePage(item._key)}
                  title="このページを削除"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 14,
                    color: "var(--card-muted-fg-color)",
                    padding: "2px 4px",
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 8, paddingLeft: 24 }}>
            <button
              type="button"
              onClick={() => onOpenPanel({ type: "addPage", categoryKey: navCategory._key })}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                border: "1px solid var(--card-border-color)",
                borderRadius: 4,
                background: "var(--card-bg-color)",
                cursor: "pointer",
                color: "var(--card-fg-color)",
              }}
            >
              + ページを追加
            </button>
            <button
              type="button"
              onClick={() => onOpenPanel({ type: "reorderPages", categoryKey: navCategory._key })}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                border: "1px solid var(--card-border-color)",
                borderRadius: 4,
                background: "var(--card-bg-color)",
                cursor: "pointer",
                color: "var(--card-fg-color)",
              }}
            >
              並び替え
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add sanity/components/navigation/CategoryItem.tsx
git commit -m "Add CategoryItem with expand/collapse, page list, and menu"
```

---

### Task 5: Right panel — AddPagePanel

**Files:**

- Create: `sanity/components/navigation/AddPagePanel.tsx`

Shows unassigned pages (pages not in any category's navigation items). Clicking a page adds it to the selected category.

- [ ] **Step 1: Create AddPagePanel**

```tsx
// sanity/components/navigation/AddPagePanel.tsx
"use client";

import { useMemo } from "react";
import { Box, Flex, Text } from "@sanity/ui";
import { i18nGet } from "../shared/i18n";
import type { NavCategoryRaw, PageDoc } from "./types";

export function AddPagePanel({
  categoryKey,
  categories,
  allPages,
  onAddPage,
  onClose,
}: {
  categoryKey: string;
  categories: NavCategoryRaw[];
  allPages: PageDoc[];
  onAddPage: (categoryKey: string, pageId: string) => void;
  onClose: () => void;
}) {
  // Find all page IDs currently assigned to any category
  const assignedPageIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cat of categories) {
      for (const item of cat.items ?? []) {
        if (item.pageRef?._ref) ids.add(item.pageRef._ref);
      }
    }
    return ids;
  }, [categories]);

  // Unassigned pages
  const unassigned = useMemo(
    () => allPages.filter((p) => !assignedPageIds.has(p._id)),
    [allPages, assignedPageIds],
  );

  const categoryLabel = (() => {
    const cat = categories.find((c) => c._key === categoryKey);
    return cat ? categoryKey : "";
  })();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box
        padding={3}
        style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}
      >
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            ページを追加
          </Text>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
              color: "var(--card-muted-fg-color)",
            }}
          >
            ✕
          </button>
        </Flex>
      </Box>

      {/* Page list */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
        {unassigned.length === 0 ? (
          <Text size={1} muted style={{ padding: "24px 16px", textAlign: "center" }}>
            未割り当てのページがありません
          </Text>
        ) : (
          unassigned.map((page) => {
            const title = i18nGet(page.title, "ja") || page.slug || "Untitled";
            return (
              <button
                key={page._id}
                type="button"
                onClick={() => onAddPage(categoryKey, page._id)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 16px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 13,
                  color: "var(--card-fg-color)",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = "var(--card-bg2-color, #f5f5f5)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = "transparent";
                }}
              >
                {title}
                {page.slug && (
                  <span
                    style={{ marginLeft: 8, fontSize: 11, color: "var(--card-muted-fg-color)" }}
                  >
                    /{page.slug}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add sanity/components/navigation/AddPagePanel.tsx
git commit -m "Add AddPagePanel for assigning unassigned pages to categories"
```

---

### Task 6: Right panel — ReorderPagesPanel

**Files:**

- Create: `sanity/components/navigation/ReorderPagesPanel.tsx`

- [ ] **Step 1: Create ReorderPagesPanel**

```tsx
// sanity/components/navigation/ReorderPagesPanel.tsx
"use client";

import { useState } from "react";
import { Box, Flex, Text } from "@sanity/ui";
import { i18nGet } from "../shared/i18n";
import type { NavItemRaw, PageDoc } from "./types";

export function ReorderPagesPanel({
  items,
  pagesMap,
  onReorder,
  onClose,
}: {
  items: NavItemRaw[];
  pagesMap: Map<string, PageDoc>;
  onReorder: (reordered: NavItemRaw[]) => void;
  onClose: () => void;
}) {
  const [localItems, setLocalItems] = useState<NavItemRaw[]>(items);

  function move(idx: number, direction: -1 | 1) {
    const target = idx + direction;
    if (target < 0 || target >= localItems.length) return;
    const next = [...localItems];
    [next[idx], next[target]] = [next[target], next[idx]];
    setLocalItems(next);
    onReorder(next);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box
        padding={3}
        style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}
      >
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            並び替え
          </Text>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
              color: "var(--card-muted-fg-color)",
            }}
          >
            ✕
          </button>
        </Flex>
      </Box>

      {/* Reorder list */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
        {localItems.map((item, idx) => {
          const pageDoc = pagesMap.get(item.pageRef?._ref);
          const title = i18nGet(pageDoc?.title, "ja") || "Untitled";
          return (
            <div
              key={item._key}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 16px",
                gap: 8,
                borderBottom: "1px solid var(--card-border-color)",
              }}
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
                {title}
              </span>
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                style={{
                  border: "1px solid var(--card-border-color)",
                  borderRadius: 4,
                  background: "var(--card-bg-color)",
                  cursor: idx === 0 ? "default" : "pointer",
                  opacity: idx === 0 ? 0.3 : 1,
                  padding: "2px 8px",
                  fontSize: 12,
                  color: "var(--card-fg-color)",
                }}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === localItems.length - 1}
                style={{
                  border: "1px solid var(--card-border-color)",
                  borderRadius: 4,
                  background: "var(--card-bg-color)",
                  cursor: idx === localItems.length - 1 ? "default" : "pointer",
                  opacity: idx === localItems.length - 1 ? 0.3 : 1,
                  padding: "2px 8px",
                  fontSize: 12,
                  color: "var(--card-fg-color)",
                }}
              >
                ↓
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add sanity/components/navigation/ReorderPagesPanel.tsx
git commit -m "Add ReorderPagesPanel with arrow-based page reorder"
```

---

### Task 7: Right panel — AddCategoryPanel

**Files:**

- Create: `sanity/components/navigation/AddCategoryPanel.tsx`

Creates a new category document with bilingual label + hero image, then adds it to the navigation array.

- [ ] **Step 1: Create AddCategoryPanel**

```tsx
// sanity/components/navigation/AddCategoryPanel.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text } from "@sanity/ui";
import createImageUrlBuilder from "@sanity/image-url";
import { BilingualInput } from "../shared/BilingualInput";
import { ImagePickerPanel } from "../shared/ImagePickerPanel";
import type { I18nString } from "../homepage/types";

export function AddCategoryPanel({
  onCategoryCreated,
  onClose,
}: {
  onCategoryCreated: (categoryId: string) => void;
  onClose: () => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(() => createImageUrlBuilder(client), [client]);

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
      await client.createOrReplace({
        _id: categoryId,
        _type: "category",
        label,
        heroImage: {
          _type: "image",
          asset: { _type: "reference", _ref: heroImageRef! },
        },
      });
      onCategoryCreated(categoryId);
    } catch (err) {
      console.error("Failed to create category:", err);
    } finally {
      setSaving(false);
    }
  }, [client, label, heroImageRef, canSave, saving, onCategoryCreated]);

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

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box
        padding={3}
        style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}
      >
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            セクションを追加
          </Text>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
              color: "var(--card-muted-fg-color)",
            }}
          >
            ✕
          </button>
        </Flex>
      </Box>

      {/* Form */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <BilingualInput label="セクション名" value={label} onChange={setLabel} />

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
            ヒーロー画像 *
          </div>
          {heroImageRef ? (
            <div
              style={{
                position: "relative",
                borderRadius: 6,
                overflow: "hidden",
                aspectRatio: "16/9",
                maxWidth: 300,
              }}
            >
              <img
                src={builder
                  .image(heroImageRef)
                  .width(400)
                  .height(225)
                  .fit("crop")
                  .auto("format")
                  .url()}
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
                maxWidth: 300,
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

        <Button
          text={saving ? "作成中…" : "セクションを作成"}
          tone="positive"
          fontSize={1}
          padding={3}
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{ marginTop: 8 }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add sanity/components/navigation/AddCategoryPanel.tsx
git commit -m "Add AddCategoryPanel with bilingual label and hero image picker"
```

---

### Task 8: Right panel — RenameCategoryPanel

**Files:**

- Create: `sanity/components/navigation/RenameCategoryPanel.tsx`

- [ ] **Step 1: Create RenameCategoryPanel**

```tsx
// sanity/components/navigation/RenameCategoryPanel.tsx
"use client";

import { useCallback, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text } from "@sanity/ui";
import { BilingualInput } from "../shared/BilingualInput";
import type { I18nString } from "../homepage/types";
import type { CategoryDoc } from "./types";

export function RenameCategoryPanel({
  categoryDoc,
  onRenamed,
  onClose,
}: {
  categoryDoc: CategoryDoc;
  onRenamed: (categoryId: string, newLabel: I18nString[]) => void;
  onClose: () => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [label, setLabel] = useState<I18nString[]>(categoryDoc.label ?? []);
  const [saving, setSaving] = useState(false);

  const canSave = label.some((l) => l.value.trim());

  const handleSave = useCallback(async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      // Update the published category document directly
      await client.patch(categoryDoc._id).set({ label }).commit();
      // Also update draft if it exists
      const draftId = `drafts.${categoryDoc._id}`;
      const draft = await client.fetch(`*[_id == $id][0]._id`, { id: draftId });
      if (draft) {
        await client.patch(draftId).set({ label }).commit();
      }
      onRenamed(categoryDoc._id, label);
    } catch (err) {
      console.error("Failed to rename category:", err);
    } finally {
      setSaving(false);
    }
  }, [client, categoryDoc._id, label, canSave, saving, onRenamed]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box
        padding={3}
        style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}
      >
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            名前を変更
          </Text>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
              color: "var(--card-muted-fg-color)",
            }}
          >
            ✕
          </button>
        </Flex>
      </Box>

      {/* Form */}
      <div style={{ padding: 16 }}>
        <BilingualInput label="セクション名" value={label} onChange={setLabel} />
        <Button
          text={saving ? "保存中…" : "保存"}
          tone="positive"
          fontSize={1}
          padding={3}
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{ marginTop: 8 }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add sanity/components/navigation/RenameCategoryPanel.tsx
git commit -m "Add RenameCategoryPanel with bilingual label edit"
```

---

### Task 9: NavigationEditor — Left pane with data loading, state, auto-save, publish

**Files:**

- Create: `sanity/components/navigation/NavigationEditor.tsx`

This is the core component. It:

1. Loads navigation doc (published + draft), all categories, and all pages
2. Manages local state for the navigation categories array
3. Auto-saves edits with 1500ms debounce
4. Handles publish with `categoryRef` sync on pages
5. Handles category delete with `homepageFeatured` reference check
6. Renders the category list with drag-and-drop reorder

- [ ] **Step 1: Create NavigationEditor**

```tsx
// sanity/components/navigation/NavigationEditor.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// ── NavigationEditor ────────────────────────────────

export function NavigationEditor({
  onOpenPanel,
  rightPanel,
}: {
  onOpenPanel: (panel: RightPanelState) => void;
  rightPanel: RightPanelState;
}) {
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

  // UI state
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
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
          `*[_type == "page" && !(_id in path("drafts.**"))] | order(_id asc) { _id, _type, title, slug, categoryRef }`,
        ),
      ]);

      setPublishedNav(pubNav);
      setDraftNav(draftNavDoc);

      // Use draft categories if available, otherwise published
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
      const baseDoc = draftNav ?? publishedNav;
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

      // Refresh draft
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
  }, [client, publishedNav, draftNav]);

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

  // ── Flush helper (for operations that need save before proceeding) ──

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

      // Sync categoryRef on pages: for each category, set categoryRef on its pages
      const navCategories = draft.categories ?? [];
      for (const navCat of navCategories) {
        const catRef = navCat.categoryRef?._ref;
        if (!catRef) continue;
        for (const item of navCat.items ?? []) {
          const pageRef = item.pageRef?._ref;
          if (!pageRef) continue;
          // Set categoryRef on the published page
          tx.patch(pageRef, (p) => p.set({ categoryRef: { _type: "reference", _ref: catRef } }));
        }
      }

      // Clear categoryRef on pages that are no longer in any category
      const assignedPageIds = new Set<string>();
      for (const navCat of navCategories) {
        for (const item of navCat.items ?? []) {
          if (item.pageRef?._ref) assignedPageIds.add(item.pageRef._ref);
        }
      }
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

      // Refresh pages (categoryRef may have changed)
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
      // Refresh category docs to include the new one
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

  const deleteCategory = useCallback(
    async (categoryKey: string) => {
      const navCat = categories.find((c) => c._key === categoryKey);
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

      // Confirm
      const ok = confirm(
        "このセクションを削除しますか？セクション内のページは削除されません。\n(Delete this section? Pages within it will not be deleted.)",
      );
      if (!ok) return;

      // Flush pending saves
      await flushSave();

      // Remove from navigation array and save
      const next = categories.filter((c) => c._key !== categoryKey);
      pendingCategoriesRef.current = next;
      setCategories(next);
      await saveToSanity();

      // Delete category document
      try {
        await client.delete(catRef);
        // Also delete draft if exists
        await client.delete(`drafts.${catRef}`).catch(() => {});
      } catch (err) {
        console.error("Failed to delete category:", err);
      }

      // Update local state
      setCategoryDocs((prev) => {
        const newMap = new Map(prev);
        newMap.delete(catRef);
        return newMap;
      });
    },
    [client, categories, flushSave, saveToSanity],
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
    // Persist the new order
    setCategories((current) => {
      updateCategories(current);
      return current;
    });
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

  // ── Expose data for right panels ──────────────────
  // These are accessed by NavigationTool via this component's props/callbacks

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
            expanded={expandedKeys.has(navCat._key)}
            onToggleExpand={() => {
              setExpandedKeys((prev) => {
                const next = new Set(prev);
                if (next.has(navCat._key)) next.delete(navCat._key);
                else next.add(navCat._key);
                return next;
              });
            }}
            onTogglePageHidden={(itemKey) => togglePageHidden(navCat._key, itemKey)}
            onRemovePage={(itemKey) => removePage(navCat._key, itemKey)}
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
}

// ── Export data accessors for NavigationTool ─────────
// NavigationTool needs access to categories, pagesMap, categoryDocs
// for right panel rendering. We'll lift this state up via a ref pattern.

export type NavigationEditorRef = {
  categories: NavCategoryRaw[];
  pagesMap: Map<string, PageDoc>;
  categoryDocs: Map<string, CategoryDoc>;
  allPages: PageDoc[];
  addPage: (categoryKey: string, pageId: string) => void;
  reorderPages: (categoryKey: string, reordered: NavItemRaw[]) => void;
  addCategoryToNav: (categoryId: string) => void;
  handleCategoryRenamed: (categoryId: string, newLabel: { _key: string; value: string }[]) => void;
};
```

**Important:** The component above manages state internally but needs to expose data/callbacks to the parent `NavigationTool` for right-panel rendering. We'll use a ref-forwarding pattern — see Task 10.

- [ ] **Step 2: Commit**

```bash
git add sanity/components/navigation/NavigationEditor.tsx
git commit -m "Add NavigationEditor with data loading, auto-save, publish, and category CRUD"
```

---

### Task 10: NavigationEditor — Add ref forwarding for parent access

**Files:**

- Modify: `sanity/components/navigation/NavigationEditor.tsx`

The parent `NavigationTool` needs access to editor data to render right panels. We'll use `useImperativeHandle` to expose a ref.

- [ ] **Step 1: Add forwardRef and useImperativeHandle**

At the top of the file, update the import:

```ts
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
```

Change the component signature to use `forwardRef`:

Replace:

```ts
export function NavigationEditor({
  onOpenPanel,
  rightPanel,
}: {
  onOpenPanel: (panel: RightPanelState) => void;
  rightPanel: RightPanelState;
}) {
```

With:

```ts
export const NavigationEditor = forwardRef<NavigationEditorRef, {
  onOpenPanel: (panel: RightPanelState) => void;
  rightPanel: RightPanelState;
}>(function NavigationEditor({ onOpenPanel, rightPanel }, ref) {
```

Add `useImperativeHandle` after the `handleCategoryRenamed` callback (before `deleteCategory`):

```ts
useImperativeHandle(
  ref,
  () => ({
    categories,
    pagesMap,
    categoryDocs,
    allPages,
    addPage,
    reorderPages,
    addCategoryToNav,
    handleCategoryRenamed,
  }),
  [
    categories,
    pagesMap,
    categoryDocs,
    allPages,
    addPage,
    reorderPages,
    addCategoryToNav,
    handleCategoryRenamed,
  ],
);
```

Close the `forwardRef` at the end of the component — change the final `}` to `})`.

- [ ] **Step 2: Commit**

```bash
git add sanity/components/navigation/NavigationEditor.tsx
git commit -m "Add ref forwarding to NavigationEditor for parent panel access"
```

---

### Task 11: NavigationTool — Two-pane wrapper

**Files:**

- Modify: `sanity/components/NavigationTool.tsx` (overwrite stub)

- [ ] **Step 1: Implement NavigationTool**

```tsx
// sanity/components/NavigationTool.tsx
"use client";

import { useRef, useState } from "react";
import { Text } from "@sanity/ui";
import { RightPanel } from "./shared/RightPanel";
import { NavigationEditor, type NavigationEditorRef } from "./navigation/NavigationEditor";
import { AddPagePanel } from "./navigation/AddPagePanel";
import { ReorderPagesPanel } from "./navigation/ReorderPagesPanel";
import { AddCategoryPanel } from "./navigation/AddCategoryPanel";
import { RenameCategoryPanel } from "./navigation/RenameCategoryPanel";
import type { RightPanelState } from "./navigation/types";

export function NavigationTool() {
  const [rightPanel, setRightPanel] = useState<RightPanelState>(null);
  const editorRef = useRef<NavigationEditorRef>(null);

  function renderRightPanel() {
    const editor = editorRef.current;
    if (!rightPanel || !editor) return null;

    switch (rightPanel.type) {
      case "addPage":
        return (
          <AddPagePanel
            categoryKey={rightPanel.categoryKey}
            categories={editor.categories}
            allPages={editor.allPages}
            onAddPage={(catKey, pageId) => {
              editor.addPage(catKey, pageId);
            }}
            onClose={() => setRightPanel(null)}
          />
        );

      case "reorderPages": {
        const navCat = editor.categories.find((c) => c._key === rightPanel.categoryKey);
        if (!navCat) return null;
        return (
          <ReorderPagesPanel
            items={navCat.items ?? []}
            pagesMap={editor.pagesMap}
            onReorder={(reordered) => {
              editor.reorderPages(rightPanel.categoryKey, reordered);
            }}
            onClose={() => setRightPanel(null)}
          />
        );
      }

      case "addCategory":
        return (
          <AddCategoryPanel
            onCategoryCreated={(categoryId) => {
              editor.addCategoryToNav(categoryId);
            }}
            onClose={() => setRightPanel(null)}
          />
        );

      case "renameCategory": {
        const renameCat = editor.categories.find((c) => c._key === rightPanel.categoryKey);
        const catDoc = renameCat ? editor.categoryDocs.get(renameCat.categoryRef?._ref) : undefined;
        if (!catDoc) return null;
        return (
          <RenameCategoryPanel
            categoryDoc={catDoc}
            onRenamed={(catId, newLabel) => {
              editor.handleCategoryRenamed(catId, newLabel);
            }}
            onClose={() => setRightPanel(null)}
          />
        );
      }

      default:
        return null;
    }
  }

  const panelContent = renderRightPanel();

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Editor pane */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <NavigationEditor ref={editorRef} onOpenPanel={setRightPanel} rightPanel={rightPanel} />
      </div>

      {/* Right panel */}
      {panelContent ? (
        <RightPanel>{panelContent}</RightPanel>
      ) : rightPanel === null ? (
        <RightPanel>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: 24,
            }}
          >
            <Text size={1} muted style={{ textAlign: "center" }}>
              カテゴリーを選択してページを管理
              <br />
              <span style={{ fontSize: 12 }}>Select a section to manage its pages</span>
            </Text>
          </div>
        </RightPanel>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -30`

Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add sanity/components/NavigationTool.tsx
git commit -m "Implement NavigationTool two-pane wrapper with right-panel routing"
```

---

### Task 12: Verify in Studio

This task is manual verification.

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify the navigation tool appears**

Open `http://localhost:3000/studio`, look for "ナビゲーション" in the top toolbar. Click it.

Expected:

- Left pane shows the category list with existing categories
- Each category expands to show pages with visibility toggles
- Right pane shows the empty state hint text
- Drag-and-drop reorder works on categories
- ⋯ menu shows Rename and Delete options

- [ ] **Step 3: Verify add page**

Expand a category, click "ページを追加". The right panel should show unassigned pages. Click one to add it.

- [ ] **Step 4: Verify reorder pages**

Click "並び替え". The right panel should show pages with arrow buttons. Reorder and verify the left panel updates.

- [ ] **Step 5: Verify add category**

Click "+ セクションを追加". Fill in the bilingual label and pick a hero image. Click "セクションを作成". A new category should appear in the list.

- [ ] **Step 6: Verify rename category**

Click ⋯ → "名前を変更" on a category. Change the label and save. The category name should update.

- [ ] **Step 7: Verify auto-save**

Make an edit (e.g., toggle visibility). Watch for "未保存" → "保存中…" → "保存済み" status transitions.

- [ ] **Step 8: Verify publish**

Click "公開". Verify the button disables when no drafts exist. After publishing, check that page `categoryRef` fields are synced in Sanity (open a page document and check the カテゴリー field).

- [ ] **Step 9: Verify category delete**

Create a test category, then delete it via ⋯ → "削除". Confirm the dialog appears. If the category is referenced in homepageFeatured, it should show the blocking message instead.

- [ ] **Step 10: Commit any fixes**

If any issues are found during manual testing, fix them and commit:

```bash
git add -A
git commit -m "Fix issues found during manual testing of navigation tool"
```

---

### Task 13: Close outside click for ⋯ menu

**Files:**

- Modify: `sanity/components/navigation/CategoryItem.tsx`

The ⋯ menu should close when clicking outside it.

- [ ] **Step 1: Add outside click handler**

Add a `useEffect` after the `menuRef` declaration:

```tsx
// Close menu on outside click
useEffect(() => {
  if (!menuOpen) return;
  function handleClick(e: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setMenuOpen(false);
    }
  }
  document.addEventListener("mousedown", handleClick);
  return () => document.removeEventListener("mousedown", handleClick);
}, [menuOpen]);
```

Add `useEffect` to the import:

```ts
import { useCallback, useEffect, useRef, useState } from "react";
```

- [ ] **Step 2: Commit**

```bash
git add sanity/components/navigation/CategoryItem.tsx
git commit -m "Add outside click handler to close category menu"
```
