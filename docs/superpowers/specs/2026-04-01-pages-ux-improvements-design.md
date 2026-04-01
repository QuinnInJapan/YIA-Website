# ページ管理 UX Improvements

**Date:** 2026-04-01
**Branch:** feature/unified-pages-tool

## Overview

A set of targeted UX improvements to the ページ管理 tool based on user feedback. No data model changes — all changes are UI/UX layer only.

---

## 1. Category Reorder Mode — Replace Drag-and-Drop with Arrow Buttons

### Problem

The current drag-and-drop for category reorder has two issues:

1. Dragging blocks that contain expanded page lists feels strange and disorienting.
2. Categories of different heights cause flickering as `onDragOver` fires rapidly when the cursor hovers in the height differential between swapped blocks.

### Design

Replace the HTML drag-and-drop in `LeftPanel` with ↑↓ arrow buttons.

**Entering reorder mode** ("ナビの順番を変更"):

- All category rows collapse (pages hidden) — no taller-than-others blocks
- Each category row shows ↑↓ arrow buttons on the right side
- The top-right "ナビの順番を変更" button is replaced by **完了** and **キャンセル** side by side
- Everything else in the left panel is dimmed and non-interactive (pointer-events blocked)
- The middle and right panels are also blocked/dimmed

**完了 button:**

- Disabled while `saveStatus === "dirty"` or `"saving"` (waiting for draft write to commit)
- Enabled only when `saveStatus === "saved"`
- On click: calls `publishNav()` (flushes pending draft + publishes), then exits reorder mode

**キャンセル button:**

- Immediately reverts `localCategories` to the pre-edit snapshot
- Exits reorder mode without saving or publishing

**Page reorder within CategoryManagement** (right panel) retains drag-and-drop — the simpler same-height items don't have the same flickering issue.

---

## 2. Hidden Page Styling — Remove Per-Row Toggle from LeftPanel

### Problem

Every page row in the left panel shows a "● 表示中" or "○ 非表示" button. Since 表示中 is the default, showing the button on every row is visual noise.

### Design

Remove the `onToggleHidden` button from `PageRow` in `LeftPanel`. Hidden pages are instead visually differentiated:

- Reduced opacity (`0.45`)
- Title text in muted color

The toggle control remains in `CategoryManagement`'s page list (middle panel), where there is more context.

---

## 3. Publish Flow — Remove NavPublishBar

### Problem

After making nav changes (reorder, hidden toggle, add/remove page), users see a "ナビ変更があります + 公開する" bar. This is an extra step that shouldn't be user-visible.

### Design

Remove `NavPublishBar` from the UI entirely. Publishing becomes automatic:

**Reorder path:** `完了` button calls `publishNav()` — see Section 1.

**All other nav ops** (hidden toggle, add page, remove page): after `saveToSanity()` completes successfully, automatically chain a `publishNav()` call. The draft is an invisible implementation detail. From the user's perspective, changes go live after ~1.5s debounce.

Race condition safety: the `完了` button is already disabled until `saveStatus === "saved"` (Section 1), so reorder mode can't publish over a concurrent in-flight save.

---

## 4. Category Header — Inline Rename + Show Both Languages

### Problem

"カテゴリ名を変更" is at the bottom of a scrollable panel, far from the category name shown in the header.

### Design

Update the `CategoryManagement` header:

- Show **Japanese label** (semibold, full size)
- Show **English label** directly below or inline, always visible, muted and smaller — not hidden in a form
- Add a small pencil icon (✎) to the right of the name
- Clicking the icon replaces the header text with a `BilingualInput` in place, with Save / キャンセル buttons
- Remove the "カテゴリ名を変更" button from the bottom section

---

## 5. SystemPageNotice — Constrain Panel Width

### Problem

When a system page (blog, announcements) is selected, the middle panel has `flex: 1` and stretches to fill the full tool width. The small informational notice looks out of place centered in a huge space.

### Design

When `middlePanel.type === "system"`, give the middle panel container `flex: 0 0 480px` instead of `flex: 1`. The remaining space to the right is left empty. No right panel is shown for system pages.

---

## 6. Category Selection — Right Panel Preview

### Problem

When a category is selected, the right panel is empty. There's no way to get a quick sense of what's in the category without reading the middle panel list.

### Design

When `middlePanel.type === "category"` and `rightPanel` is null, render a new `CategoryPreview` component in `<RightPanel>`.

`CategoryPreview` is a read-only scrollable list of the pages in the selected category:

- Page title (Japanese)
- Hidden pages styled with reduced opacity and muted color (matching Section 2's visual language)
- No interactive controls — preview only

Component receives `navCat` and `pagesMap` as props. Lives in `sanity/components/unified-pages/CategoryPreview.tsx`.

---

## Files Affected

| File                                                     | Change                                                                                                                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sanity/components/unified-pages/LeftPanel.tsx`          | Replace D&D with ↑↓ arrows; collapse on reorder mode; 完了/キャンセル buttons; disable surroundings; remove hidden toggle from PageRow; remove NavPublishBar render |
| `sanity/components/unified-pages/NavPublishBar.tsx`      | Delete                                                                                                                                                              |
| `sanity/components/unified-pages/useNavData.ts`          | Auto-publish after saveToSanity succeeds                                                                                                                            |
| `sanity/components/unified-pages/CategoryManagement.tsx` | Inline rename in header (show JP + EN + pencil icon); remove bottom rename button                                                                                   |
| `sanity/components/unified-pages/CategoryPreview.tsx`    | New component — read-only page listing                                                                                                                              |
| `sanity/components/UnifiedPagesTool.tsx`                 | Fixed-width middle panel for system pages; render CategoryPreview in right panel for category selection; pass `isReorderMode` down to dim middle/right panels       |
