# Navigation Plugin Cover Photos — Design Spec

**Date:** 2026-03-31  
**Branch:** feature/wave2-nav-plugin-v2  
**Scope:** Add category hero images to the navigation plugin UI — as a right-side accent thumbnail in the left panel's category list, and as an editable full-width image at the top of the EditCategoryPanel.

---

## Goal

Give editors visual anchors in the navigation plugin by surfacing category hero images in both the overview list and the category edit panel. Editors can also change a category's hero image directly from the EditCategoryPanel without leaving the plugin.

---

## Data Layer

### `types.ts`

- Add optional `coverImage?: ImageField` to `PageDoc` (keeps type aligned with schema; unused by this feature but accurate).
- Add `{ type: "changeHeroImage"; categoryKey: string }` to `RightPanelState`.

### GROQ query in `NavigationEditor`

- Update the pages query to fetch `"coverImage": images[0]` alongside existing fields.
- No change to the nav or category queries (category already fetches `heroImage`).

### `NavigationEditorRef`

- Add `onHeroImageChanged(categoryId: string, assetRef: string): Promise<void>`
  - Patches the category document: `{ heroImage: { _type: "image", asset: { _type: "reference", _ref: assetRef } } }`
  - Refreshes the `categoryDocs` map entry for that category.

---

## Left Panel — `CategoryItem`

**Layout:** `[label / en-label] [page count] [thumbnail] [⋯ menu]`

- Thumbnail is a right-side accent, positioned between page count and the ⋯ menu.
- Size: 48×28px, `border-radius: 3px`, `object-fit: cover`.
- URL built at `width(96).height(56).fit("crop").auto("format")` (2× retina).
- If no `heroImage`: render a muted gray placeholder div of the same dimensions — no text.
- `useClient` + `createImageUrlBuilder` instantiated inside `CategoryItem` (already a `"use client"` component).
- Existing text layout (label, page count) is unchanged — thumbnail is purely additive on the right.

---

## Right Panel — `EditCategoryPanel`

### Hero image section (new, above page list)

- Full-width 16:9 image block with `border-radius: 4px`, `object-fit: cover`.
- URL built at `width(600).height(338).fit("crop").auto("format")`.
- If no `heroImage`: muted placeholder with text `"画像なし"`.
- An `"画像を変更"` button sits below the image (or centered in the placeholder).
- On click: calls `onOpenPanel({ type: "changeHeroImage", categoryKey: navCategory._key })`.
- `EditCategoryPanel` receives `categoryDoc` already; no new props needed for display.
- `useClient` + `createImageUrlBuilder` instantiated inside `EditCategoryPanel`.

### No changes to the page list section.

---

## `NavigationTool` — `changeHeroImage` panel state

- Renders `ImagePickerPanel` in the right panel slot.
- On image selected:
  1. Calls `editor.onHeroImageChanged(categoryId, assetRef)`.
  2. Transitions back to `{ type: "editCategory", categoryKey }`.
- On close: transitions back to `{ type: "editCategory", categoryKey }`.

---

## Files Changed

| File                                                 | Change                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------- |
| `sanity/components/navigation/types.ts`              | Add `coverImage` to `PageDoc`; add `changeHeroImage` to `RightPanelState` |
| `sanity/components/navigation/NavigationEditor.tsx`  | Update pages GROQ; add `onHeroImageChanged` to ref and implementation     |
| `sanity/components/navigation/CategoryItem.tsx`      | Add right-side thumbnail accent                                           |
| `sanity/components/navigation/EditCategoryPanel.tsx` | Add hero image section at top; fire `onOpenPanel` for image change        |
| `sanity/components/NavigationTool.tsx`               | Handle `changeHeroImage` panel state; render `ImagePickerPanel`           |

---

## Out of Scope

- Page cover photos in the EditCategoryPanel page list (not needed per spec).
- Uploading new images (uses existing `ImagePickerPanel` which browses the media library).
- Any changes to the category or page schemas.
