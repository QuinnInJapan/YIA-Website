# Navigation Plugin UI Polish — Design Spec

**Date:** 2026-03-31
**Branch:** feature/wave2-nav-plugin-v2
**Scope:** Two UI improvements to the navigation plugin — (1) hero image editing in EditCategoryPanel with the shared overlay button pattern, and (2) six-dot drag handles replacing arrow buttons.

---

## Goal

Polish the navigation plugin UI to match the quality of other editors: use the same hover-overlay image editing pattern (変更/切り抜き), add clear section labels, and replace arrow-button reordering with drag handles throughout.

---

## Feature 1: EditCategoryPanel Image Section

### Section labels

Add a `画像` label above the hero image block and a `ページ` label above the page list. Style: `fontSize: 12, color: var(--card-muted-fg-color), marginBottom: 6` — consistent with section labels used elsewhere (e.g. `HeroSection.tsx`).

### Hero image display

Replace the current plain image + "画像を変更" button with the shared `ImageOverlayActions` + `OverlayButton` hover overlay pattern from `sanity/components/homepage/HeroSection.tsx`:

- **When image exists:** render inside `ImageOverlayActions` with two `OverlayButton`s — **変更** and **切り抜き** — visible on hover
- **When no image:** render `EmptyImageSlot` (existing shared component, shows `+ 画像を追加`)

Both `ImageOverlayActions`, `OverlayButton`, and `EmptyImageSlot` are already exported from `HeroSection.tsx` — import directly, no duplication.

### 変更 — inline image picker

Clicking **変更** toggles an inline `ImagePickerPanel` that renders directly below the hero image block within `EditCategoryPanel`. No panel state transition — `EditCategoryPanel` manages `showImagePicker: boolean` internally.

- `EditCategoryPanel` receives `onHeroImageChanged: (assetRef: string) => Promise<void>` as a new prop (replaces `onOpenPanel`)
- On image select: calls `onHeroImageChanged(assetRef)`, then sets `showImagePicker` to false
- On picker close: sets `showImagePicker` to false

**Cleanup:** Remove `{ type: "changeHeroImage"; categoryKey: string }` from `RightPanelState`, the `changeHeroImage` case from `NavigationTool`, and the `onOpenPanel` prop from `EditCategoryPanel`. Replace with `onHeroImageChanged` passed directly from `NavigationTool` (calls `editor.onHeroImageChanged`).

### 切り抜き — HotspotCropTool panel

Clicking **切り抜き** opens `HotspotCropTool` in the right panel via a new `{ type: "hotspotCrop"; imageUrl: string; value: HotspotCropValue; onChange: (v: HotspotCropValue) => void }` state in `RightPanelState`. Returns to `editCategory` on close.

- `EditCategoryPanel` receives `onShowHotspotCrop: (imageUrl: string, value: HotspotCropValue, onChange: (v: HotspotCropValue) => void) => void` as a prop
- `NavigationTool` handles `hotspotCrop` panel state identically to `HomepageTool`
- `HotspotCropValue` is imported from `sanity/components/shared/HotspotCropTool.tsx`
- The `onChange` callback constructed in `NavigationTool`'s `editCategory` case:
  ```typescript
  (newValue: HotspotCropValue) => {
    const updatedImage = {
      ...catDoc.heroImage,
      hotspot: { _type: "sanity.imageHotspot" as const, ...newValue.hotspot },
      crop: { _type: "sanity.imageCrop" as const, ...newValue.crop },
    };
    editor.onHeroImageChanged(categoryId, updatedImage);
  };
  ```
- `NavigationEditor.onHeroImageChanged` patches the category doc with the full `ImageField` and updates `categoryDocs` map

### Updated `onHeroImageChanged` signature

Change from `(categoryId: string, assetRef: string)` to `(categoryId: string, image: ImageField)`.

This allows both 変更 (passes `{ _type: "image", asset: { _type: "reference", _ref: assetRef } }`) and 切り抜き (passes the full image with hotspot/crop) to use the same method.

Update `NavigationEditorRef` type, implementation in `NavigationEditor`, and call sites in `NavigationTool`.

---

## Feature 2: Drag Handles

### Shared `DragHandle` component

Create `sanity/components/navigation/DragHandle.tsx`:

```tsx
export function DragHandle() {
  return (
    <svg
      width="12"
      height="16"
      viewBox="0 0 12 16"
      fill="none"
      style={{ cursor: "grab", flexShrink: 0, color: "var(--card-muted-fg-color)" }}
    >
      <circle cx="3" cy="3" r="1.5" fill="currentColor" />
      <circle cx="9" cy="3" r="1.5" fill="currentColor" />
      <circle cx="3" cy="8" r="1.5" fill="currentColor" />
      <circle cx="9" cy="8" r="1.5" fill="currentColor" />
      <circle cx="3" cy="13" r="1.5" fill="currentColor" />
      <circle cx="9" cy="13" r="1.5" fill="currentColor" />
    </svg>
  );
}
```

### `CategoryItem` — left-side handle

- Add `<DragHandle />` as the **first child** inside the category header row flex container
- No change to drag logic — `draggable` stays on the outer div, handlers stay in `NavigationEditor`

### `EditCategoryPanel` — page list drag handles

- Remove ↑/↓ arrow buttons entirely from each page row
- Add `<DragHandle />` as the **first child** of each page row
- Implement HTML5 drag-and-drop on page items using `useRef` for drag index tracking, identical to the category drag pattern in `NavigationEditor`:
  - `dragIdxRef = useRef<number | null>(null)` inside `EditCategoryPanel`
  - `draggable` on each page row div
  - `onDragStart`: set `dragIdxRef.current = idx`
  - `onDragOver`: if `fromIdx !== idx`, swap items in `localItems`, update `dragIdxRef`
  - `onDragEnd`: call `onReorder(localItems)`, clear `dragIdxRef`

---

## Files Changed

| File                                                 | Change                                                                                                                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sanity/components/navigation/DragHandle.tsx`        | **Create** — shared six-dot drag handle SVG                                                                                                                                                |
| `sanity/components/navigation/types.ts`              | Remove `changeHeroImage`; add `hotspotCrop`; update `ImageField` usage                                                                                                                     |
| `sanity/components/navigation/NavigationEditor.tsx`  | Update `onHeroImageChanged` signature to accept `ImageField`                                                                                                                               |
| `sanity/components/navigation/CategoryItem.tsx`      | Add `<DragHandle />` on left                                                                                                                                                               |
| `sanity/components/navigation/EditCategoryPanel.tsx` | Section labels; `ImageOverlayActions` pattern; inline picker; `onShowHotspotCrop`; drag handles; remove arrows; remove `onOpenPanel`, add `onHeroImageChanged` + `onShowHotspotCrop` props |
| `sanity/components/NavigationTool.tsx`               | Remove `changeHeroImage` case; add `hotspotCrop` case; pass `onHeroImageChanged` + `onShowHotspotCrop` to `EditCategoryPanel`                                                              |

---

## Out of Scope

- Page-level hotspot/crop (pages don't have a hero image in this panel)
- Keyboard reordering fallback for drag handles
- Any changes to category or page schemas
