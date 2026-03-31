# Navigation Plugin Cover Photos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add category hero image thumbnails to the navigation plugin — as a right-side accent in the left panel's category list, and as an editable full-width image at the top of the EditCategoryPanel.

**Architecture:** Extend `RightPanelState` with a `changeHeroImage` state, wire `ImagePickerPanel` into `NavigationTool`'s panel switch, and add `onHeroImageChanged` to `NavigationEditorRef` which patches the category document directly. `CategoryItem` and `EditCategoryPanel` each instantiate their own `useClient` + `createImageUrlBuilder` for URL generation.

**Tech Stack:** React, Sanity Studio (`useClient`, `@sanity/image-url`), TypeScript

---

## File Map

| File                                                 | Change                                                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `sanity/components/navigation/types.ts`              | Add `coverImage` to `PageDoc`; add `changeHeroImage` to `RightPanelState`                            |
| `sanity/components/navigation/NavigationEditor.tsx`  | Update pages GROQ; add `onHeroImageChanged` to ref interface and implementation                      |
| `sanity/components/navigation/CategoryItem.tsx`      | Add right-side thumbnail accent using `heroImage` from `categoryDoc`                                 |
| `sanity/components/navigation/EditCategoryPanel.tsx` | Add hero image display + "画像を変更" button at top; add `onOpenPanel` prop                          |
| `sanity/components/NavigationTool.tsx`               | Handle `changeHeroImage` state; render `ImagePickerPanel`; pass `onOpenPanel` to `EditCategoryPanel` |

---

### Task 1: Extend types

**Files:**

- Modify: `sanity/components/navigation/types.ts`

- [ ] **Step 1: Add `coverImage` to `PageDoc` and `changeHeroImage` to `RightPanelState`**

Replace the entire file with:

```typescript
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
  coverImage?: ImageField;
}

// ── Right panel state machine ───────────────────────

export type RightPanelState =
  | null
  | { type: "editCategory"; categoryKey: string }
  | { type: "addPage"; categoryKey: string }
  | { type: "addCategory" }
  | { type: "renameCategory"; categoryKey: string }
  | { type: "changeHeroImage"; categoryKey: string };

// ── Callback types ──────────────────────────────────

export type OnOpenRightPanel = (panel: RightPanelState) => void;
```

- [ ] **Step 2: Commit**

```bash
git add sanity/components/navigation/types.ts
git commit -m "Add coverImage to PageDoc and changeHeroImage to RightPanelState"
```

---

### Task 2: Update `NavigationEditor` — GROQ query and `onHeroImageChanged`

**Files:**

- Modify: `sanity/components/navigation/NavigationEditor.tsx`

- [ ] **Step 1: Update the pages GROQ query to include `coverImage`**

In `loadData`, find the pages fetch and change:

```typescript
        client.fetch<PageDoc[]>(
          `*[_type == "page" && !(_id in path("drafts.**"))] | order(_id asc) { _id, _type, title, slug, categoryRef }`,
        ),
```

to:

```typescript
        client.fetch<PageDoc[]>(
          `*[_type == "page" && !(_id in path("drafts.**"))] | order(_id asc) { _id, _type, title, slug, categoryRef, "coverImage": images[0] }`,
        ),
```

- [ ] **Step 2: Add `onHeroImageChanged` to the `NavigationEditorRef` type**

In the `NavigationEditorRef` type block (around line 29), add:

```typescript
onHeroImageChanged: (categoryId: string, assetRef: string) => Promise<void>;
```

So the full type reads:

```typescript
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
```

- [ ] **Step 3: Implement `onHeroImageChanged` callback**

After the `handleCategoryRenamed` callback (around line 340), add:

```typescript
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
```

- [ ] **Step 4: Expose `onHeroImageChanged` through `useImperativeHandle`**

In the `useImperativeHandle` call, add `onHeroImageChanged` to both the returned object and the dependency array:

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
git add sanity/components/navigation/NavigationEditor.tsx
git commit -m "Add onHeroImageChanged to NavigationEditor and update pages GROQ query"
```

---

### Task 3: Add thumbnail accent to `CategoryItem`

**Files:**

- Modify: `sanity/components/navigation/CategoryItem.tsx`

- [ ] **Step 1: Add imports for `useClient` and `createImageUrlBuilder`**

At the top of the file, after the existing imports, add:

```typescript
import { useClient } from "sanity";
import createImageUrlBuilder from "@sanity/image-url";
import { useMemo } from "react";
```

(Note: `useCallback`, `useEffect`, `useRef`, `useState` are already imported — add `useMemo` to that existing import line instead of duplicating the import.)

The existing React import line is:

```typescript
import { useCallback, useEffect, useRef, useState } from "react";
```

Change it to:

```typescript
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
```

Then add after the existing imports:

```typescript
import { useClient } from "sanity";
import createImageUrlBuilder from "@sanity/image-url";
```

- [ ] **Step 2: Build the thumbnail URL inside the component**

Inside the `CategoryItem` function body, after the existing variable declarations (`labelJa`, `labelEn`, `pageCount`), add:

```typescript
const client = useClient({ apiVersion: "2024-01-01" });
const builder = useMemo(() => createImageUrlBuilder(client), [client]);

const thumbUrl = useMemo(() => {
  if (!categoryDoc?.heroImage?.asset?._ref) return null;
  return builder.image(categoryDoc.heroImage).width(96).height(56).fit("crop").auto("format").url();
}, [categoryDoc, builder]);
```

- [ ] **Step 3: Render the thumbnail between page count and ⋯ menu**

In the category header row's inner content, find the page count `<span>` and the menu `<div>`. The current order is:
`[label span] [page count span] [menu div]`

Insert the thumbnail between page count and the menu div:

```tsx
        <span style={{ fontSize: 11, color: "var(--card-muted-fg-color)", flexShrink: 0 }}>
          {pageCount}ページ
        </span>

        {/* Thumbnail accent */}
        <div
          style={{
            width: 48,
            height: 28,
            borderRadius: 3,
            overflow: "hidden",
            flexShrink: 0,
            background: "var(--card-muted-bg-color, #eee)",
          }}
        >
          {thumbUrl && (
            <img
              src={thumbUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          )}
        </div>

        <div style={{ position: "relative", flexShrink: 0 }} ref={menuRef}>
```

- [ ] **Step 4: Verify in the browser**
  - Open Sanity Studio → Navigation tool
  - Categories with a `heroImage` should show a small 48×28px thumbnail on the right side of each row, between the page count and the ⋯ menu
  - Categories without a `heroImage` should show a muted gray placeholder of the same size
  - Existing text (label, page count) and the ⋯ menu should be unchanged

- [ ] **Step 5: Commit**

```bash
git add sanity/components/navigation/CategoryItem.tsx
git commit -m "Add hero image thumbnail accent to CategoryItem"
```

---

### Task 4: Add hero image section to `EditCategoryPanel`

**Files:**

- Modify: `sanity/components/navigation/EditCategoryPanel.tsx`

- [ ] **Step 1: Add imports**

Add to the existing imports:

```typescript
import { useClient } from "sanity";
import createImageUrlBuilder from "@sanity/image-url";
import { useMemo } from "react";
```

The existing React import is:

```typescript
import { useState } from "react";
```

Change to:

```typescript
import { useMemo, useState } from "react";
```

Add after existing imports:

```typescript
import { useClient } from "sanity";
import createImageUrlBuilder from "@sanity/image-url";
```

- [ ] **Step 2: Add `onOpenPanel` to the component props**

The current props interface is:

```typescript
export function EditCategoryPanel({
  navCategory,
  categoryDoc,
  pagesMap,
  onTogglePageHidden,
  onRemovePage,
  onReorder,
  onAddPage,
  onClose,
}: {
  navCategory: NavCategoryRaw;
  categoryDoc: CategoryDoc | undefined;
  pagesMap: Map<string, PageDoc>;
  onTogglePageHidden: (itemKey: string) => void;
  onRemovePage: (itemKey: string) => void;
  onReorder: (reordered: NavItemRaw[]) => void;
  onAddPage: () => void;
  onClose: () => void;
});
```

Add `onOpenPanel` and the `RightPanelState` import:

```typescript
import type { NavCategoryRaw, NavItemRaw, CategoryDoc, PageDoc, RightPanelState } from "./types";
```

(The existing import already has these types except `RightPanelState` — add it to the existing import.)

Update the props:

```typescript
export function EditCategoryPanel({
  navCategory,
  categoryDoc,
  pagesMap,
  onTogglePageHidden,
  onRemovePage,
  onReorder,
  onAddPage,
  onOpenPanel,
  onClose,
}: {
  navCategory: NavCategoryRaw;
  categoryDoc: CategoryDoc | undefined;
  pagesMap: Map<string, PageDoc>;
  onTogglePageHidden: (itemKey: string) => void;
  onRemovePage: (itemKey: string) => void;
  onReorder: (reordered: NavItemRaw[]) => void;
  onAddPage: () => void;
  onOpenPanel: (panel: RightPanelState) => void;
  onClose: () => void;
});
```

- [ ] **Step 3: Build the hero image URL inside the component**

After the existing `labelJa` declaration, add:

```typescript
const client = useClient({ apiVersion: "2024-01-01" });
const builder = useMemo(() => createImageUrlBuilder(client), [client]);

const heroUrl = useMemo(() => {
  if (!categoryDoc?.heroImage?.asset?._ref) return null;
  return builder
    .image(categoryDoc.heroImage)
    .width(600)
    .height(338)
    .fit("crop")
    .auto("format")
    .url();
}, [categoryDoc, builder]);
```

- [ ] **Step 4: Add the hero image section above the page list**

In the JSX, between the closing `</Box>` of the header and the start of the page list `<div>`, insert:

```tsx
{
  /* Hero image section */
}
<div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
  <div
    style={{
      width: "100%",
      aspectRatio: "16/9",
      borderRadius: 4,
      overflow: "hidden",
      background: "var(--card-muted-bg-color, #eee)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    }}
  >
    {heroUrl ? (
      <img
        src={heroUrl}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    ) : (
      <span style={{ fontSize: 12, color: "var(--card-muted-fg-color)" }}>画像なし</span>
    )}
  </div>
  <button
    type="button"
    onClick={() => onOpenPanel({ type: "changeHeroImage", categoryKey: navCategory._key })}
    style={{
      marginTop: 6,
      fontSize: 12,
      padding: "4px 10px",
      border: "1px solid var(--card-border-color)",
      borderRadius: 4,
      background: "transparent",
      cursor: "pointer",
      color: "var(--card-muted-fg-color)",
    }}
  >
    画像を変更
  </button>
</div>;
```

- [ ] **Step 5: Verify in the browser**
  - Click a category in the left panel
  - The EditCategoryPanel should show a 16:9 hero image at the top
  - Categories without a heroImage should show a muted gray placeholder with "画像なし"
  - The "画像を変更" button should be visible below the image
  - Clicking it should (not yet work fully — `NavigationTool` not updated yet)

- [ ] **Step 6: Commit**

```bash
git add sanity/components/navigation/EditCategoryPanel.tsx
git commit -m "Add hero image display and change button to EditCategoryPanel"
```

---

### Task 5: Wire `changeHeroImage` in `NavigationTool`

**Files:**

- Modify: `sanity/components/NavigationTool.tsx`

- [ ] **Step 1: Add `ImagePickerPanel` import**

Add to the existing imports:

```typescript
import { ImagePickerPanel } from "./shared/ImagePickerPanel";
```

- [ ] **Step 2: Pass `onOpenPanel` to `EditCategoryPanel` in the switch**

In the `renderRightPanel` function, the `editCategory` case currently renders:

```typescript
        return (
          <EditCategoryPanel
            navCategory={navCat}
            categoryDoc={catDoc}
            pagesMap={editor.pagesMap}
            onTogglePageHidden={(itemKey) =>
              editor.togglePageHidden(rightPanel.categoryKey, itemKey)
            }
            onRemovePage={(itemKey) => editor.removePage(rightPanel.categoryKey, itemKey)}
            onReorder={(reordered) => editor.reorderPages(rightPanel.categoryKey, reordered)}
            onAddPage={() =>
              setRightPanel({ type: "addPage", categoryKey: rightPanel.categoryKey })
            }
            onClose={() => setRightPanel(null)}
          />
        );
```

Add the `onOpenPanel` prop:

```typescript
        return (
          <EditCategoryPanel
            navCategory={navCat}
            categoryDoc={catDoc}
            pagesMap={editor.pagesMap}
            onTogglePageHidden={(itemKey) =>
              editor.togglePageHidden(rightPanel.categoryKey, itemKey)
            }
            onRemovePage={(itemKey) => editor.removePage(rightPanel.categoryKey, itemKey)}
            onReorder={(reordered) => editor.reorderPages(rightPanel.categoryKey, reordered)}
            onAddPage={() =>
              setRightPanel({ type: "addPage", categoryKey: rightPanel.categoryKey })
            }
            onOpenPanel={setRightPanel}
            onClose={() => setRightPanel(null)}
          />
        );
```

- [ ] **Step 3: Add the `changeHeroImage` case to the switch**

After the `renameCategory` case and before `default:`, add:

```typescript
      case "changeHeroImage": {
        const changeCat = editor.categories.find((c) => c._key === rightPanel.categoryKey);
        const categoryId = changeCat?.categoryRef?._ref;
        if (!categoryId) return null;
        return (
          <ImagePickerPanel
            onSelect={async (assetRef) => {
              await editor.onHeroImageChanged(categoryId, assetRef);
              setRightPanel({ type: "editCategory", categoryKey: rightPanel.categoryKey });
            }}
            onClose={() =>
              setRightPanel({ type: "editCategory", categoryKey: rightPanel.categoryKey })
            }
          />
        );
      }
```

- [ ] **Step 4: Verify end-to-end in the browser**
  - Open Navigation tool → click a category
  - The EditCategoryPanel opens with a hero image at the top
  - Click "画像を変更"
  - The `ImagePickerPanel` opens (media browser)
  - Select an image
  - The panel transitions back to `EditCategoryPanel` with the new hero image displayed
  - The CategoryItem in the left panel also updates to show the new thumbnail
  - Reload to confirm the change persisted (Sanity GROQ subscriptions not added here — this is a draft-level patch)

- [ ] **Step 5: Commit**

```bash
git add sanity/components/NavigationTool.tsx
git commit -m "Wire changeHeroImage panel state and ImagePickerPanel in NavigationTool"
```

---

## Self-Review

**Spec coverage check:**

- ✅ `coverImage` added to `PageDoc` — Task 1
- ✅ `changeHeroImage` added to `RightPanelState` — Task 1
- ✅ Pages GROQ updated — Task 2
- ✅ `onHeroImageChanged` on ref — Task 2
- ✅ CategoryItem right-side thumbnail accent (48×28px, gray placeholder fallback) — Task 3
- ✅ EditCategoryPanel hero image section at top, "画像を変更" button, `onOpenPanel` — Task 4
- ✅ NavigationTool handles `changeHeroImage`, renders `ImagePickerPanel`, transitions back — Task 5
- ✅ `onOpenPanel` passed to `EditCategoryPanel` — Task 5

**Placeholder scan:** No TBDs, no "similar to above" shortcuts, all code blocks complete.

**Type consistency:**

- `RightPanelState` `changeHeroImage` uses `categoryKey: string` — consistent across Task 1 (type def), Task 4 (`onOpenPanel` call), Task 5 (case handler)
- `onHeroImageChanged(categoryId, assetRef)` — consistent across Task 2 (def + impl) and Task 5 (call site, resolves `categoryId` from `categoryRef._ref`)
- `onOpenPanel` prop type is `(panel: RightPanelState) => void` — consistent with `setRightPanel` passed in Task 5
