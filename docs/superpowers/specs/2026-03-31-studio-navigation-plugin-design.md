# Custom Sanity Studio Navigation & Featured Plugin — Wave 2

**Date:** 2026-03-31 (revised)
**Scope:** Custom Sanity Studio plugin for navigation management + updated homepage editor Programs section. Builds on Wave 1 schemas (`navigation`, `homepageFeatured`, `category`).

## Problem

Wave 1 created the data model for flexible navigation and homepage featured categories, but admins currently edit these through Sanity's raw auto-generated forms. Non-technical users need a purpose-built interface that makes the mental model clear (what's a category vs. a page) and lets them see the consequences of their changes.

## Mental Model

The tool communicates three concepts:

- **Sections** = the top-level groups in the website menu (currently called "categories" in the data model, but presented to users as "sections" for clarity)
- **Pages** = content pages that belong to exactly one section
- **Visibility** = whether a page appears in the nav menu (hidden pages still exist, just aren't shown)

Key constraint: **a page belongs to exactly one section.** Adding a page to a section means moving it from its current section. The tool must handle this as a move operation, not a copy.

## Requirements

1. Standalone navigation tool in the Studio sidebar for managing the navbar
2. Two-pane layout: bird's-eye overview (left) + contextual workspace (right)
3. Category CRUD: create, rename, delete — with contextual delete protection if featured on homepage
4. Move pages between categories (updates both `navigation` array and page's `categoryRef`)
5. Reorder categories via drag-and-drop (following existing gallery panel pattern)
6. Reorder pages within categories via the right panel
7. Toggle page visibility with an explicit labeled button (not an icon)
8. Updated Programs section in the homepage editor for `homepageFeatured` slot management
9. Cross-document awareness is contextual only
10. Follow existing plugin patterns: tool-based, `useClient`, auto-save with debounce, bilingual support, draft/publish workflow

## Architecture

Two independent editing surfaces with lazy cross-references:

- **Navigation tool** (new standalone plugin): manages the `navigation` document and `category` documents. Two-pane layout with overview and contextual workspace.
- **Homepage editor** (existing, modified): the Programs section is rewritten to manage the `homepageFeatured` document. Category/page pickers fetch navigation data only when opened.

Both follow the established plugin pattern from `HomepageTool.tsx` / `HomepageEditor.tsx`.

## Navigation Tool

### Design Principles

- **Left panel = bird's-eye view.** Quick scanning, small inline actions (visibility toggle). No complex forms or multi-step operations.
- **Right panel = contextual workspace.** Opens for complex operations (reorder pages, move page, add page, add category). Returns to empty state when done.
- **If an operation is small, keep it on the left** (avoids forcing the user to look away from context).
- **If an operation is large, use the right panel** (avoids blowing out the left panel with forms).

### Left Pane — Overview

Top bar with tool title ("ナビゲーション") and save/publish button.

**Category list (drag-and-drop reorder):**

Categories are reorderable via drag-and-drop, following the native HTML5 drag pattern from the existing gallery panel (`GalleryPanel.tsx`).

Each category row (collapsed):

```
▶ イベント / Events                              3 pages    ⋯
```

- Click/tap anywhere on the row to expand (entire div is the hit target)
- Page count shown as metadata
- ⋯ menu for rare actions: Rename, Delete

Each category row (expanded):

```
▼ イベント / Events                              3 pages    ⋯
    日本語教室                                    表示中
    国際交流パーティー                             表示中
    ボランティア募集                               非表示     (dimmed)
    [+ ページを追加]   [並び替え]
```

- Japanese title only per page (clean, scannable)
- Visibility: explicit labeled button ("表示中" / "非表示") — not an icon
- Hidden pages are dimmed
- "ページを追加" button → opens right panel with page picker
- "並び替え" button → opens right panel with reorder UI

**Category ⋯ menu actions:**

- **Rename:** Opens right panel with `BilingualInput` for label editing
- **Delete:** Two-step — checks `homepageFeatured`, blocks if referenced, otherwise confirms then removes from navigation array, flushes save, then deletes category document

**"+ セクションを追加" button** at the bottom of the category list → opens right panel with add-category form.

### Right Pane — Contextual Workspace

**Default state:** Empty with hint text ("カテゴリーを選択してページを管理 / Select a section to manage its pages").

**Add page mode:**

- Shows all page documents not currently in this category
- Since pages belong to exactly one category, adding a page that's in another category shows a confirmation: "このページは「{other category}」から移動されます。(This page will be moved from '{other category}'.)"
- Moving a page updates both the `navigation` array (remove from old category, add to new) and the page's `categoryRef` field

**Reorder pages mode:**

- Shows all pages in the selected category
- Arrow buttons (up/down) to reorder
- Changes apply immediately to the left panel overview

**Add category mode:**

- `BilingualInput` for label (Japanese + English)
- Image picker for hero image (required)
- Creates `category` document (auto-generated ID), publishes immediately, adds reference to `navigation` array

**Rename category mode:**

- `BilingualInput` pre-filled with current label
- Save button applies change

### Data Flow

- Fetches `navigation` document on load (published + draft), plus all `category` and `page` documents
- Edits go through `pendingEdits` → 1500ms debounced auto-save (existing pattern)
- Category CRUD operates on `category` documents directly via Sanity client
- Moving a page between categories: updates `navigation` array (remove from source, add to target), updates page's `categoryRef` field, saves both
- On category delete: fetches `homepageFeatured` to check if referenced. If so, shows warning and blocks. Otherwise: flushes pending saves, removes from `navigation` array, saves, then deletes `category` document.
- Publish via `transaction.createOrReplace()` + delete draft

## Homepage Editor — Updated Programs Section

### Slot Editor

Replaces current `ProgramCardsSection.tsx`. Shows 4 slot cards:

- Each slot displays:
  - Category hero image thumbnail as background
  - Category label (Japanese + English)
  - List of featured pages (up to 4) with titles
  - "Change category" action — opens a picker of available categories
  - "Edit pages" action — opens a picker showing pages from that category's navigation items; select up to 4 and reorder

### Data Flow

- `homepageFeatured` document added to `HomepageEditor.tsx` multi-document state management
- Slot edits update `homepageFeatured` state
- Page picker fetches `navigation` document only when opened (contextual awareness)
- Auto-save and publish handled by parent `HomepageEditor` (existing 1500ms debounce)
- `HomepagePreview.tsx` updated to consume `homepageFeatured` data instead of filtering categories by hero image

## UX Copy

**Navigation tool:**

- Tool title: "ナビゲーション"
- Tool subtitle: "サイトのメニューを管理します (Manage the site menu)"
- Category label: section name (Japanese / English)
- Visibility button: "表示中 (Visible)" / "非表示 (Hidden)"
- Delete category confirmation: "このセクションを削除しますか？セクション内のページは削除されません。(Delete this section? Pages within it will not be deleted.)"
- Featured delete blocked: "このカテゴリーはホームページで使用中のため削除できません。(This category is used on the homepage and cannot be deleted.)"
- Move page confirmation: "このページは「{category}」から移動されます。(This page will be moved from '{category}'.)"
- Empty right panel: "カテゴリーを選択してページを管理 (Select a section to manage its pages)"
- Add page button: "ページを追加"
- Reorder button: "並び替え"
- Add section button: "セクションを追加"

**Homepage Programs section:**

- Section heading: "注目カテゴリー (Featured Categories)"
- Slot labels: "スロット 1-4"
- Page picker: "表示するページを選択（最大4件）(Select pages to display, max 4)"

Copy can be refined after initial implementation.

## File Structure

### Navigation tool (new)

| File                                                   | Responsibility                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `sanity/components/navigationPlugin.ts`                | Plugin definition                                                         |
| `sanity/components/NavigationTool.tsx`                 | Two-pane wrapper with right-panel state machine                           |
| `sanity/components/navigation/NavigationEditor.tsx`    | Left pane: category list with drag reorder, page rows, visibility toggles |
| `sanity/components/navigation/CategoryItem.tsx`        | Category row: expand/collapse, page list, ⋯ menu                          |
| `sanity/components/navigation/PageItem.tsx`            | Page row: title, visibility button                                        |
| `sanity/components/navigation/AddPagePanel.tsx`        | Right pane: page picker with move confirmation                            |
| `sanity/components/navigation/ReorderPagesPanel.tsx`   | Right pane: arrow-based page reorder                                      |
| `sanity/components/navigation/AddCategoryPanel.tsx`    | Right pane: bilingual label + hero image form                             |
| `sanity/components/navigation/RenameCategoryPanel.tsx` | Right pane: bilingual label edit                                          |
| `sanity/components/navigation/types.ts`                | TypeScript interfaces                                                     |

### Homepage editor (modified)

| File                                                 | Responsibility                                        |
| ---------------------------------------------------- | ----------------------------------------------------- |
| `sanity/components/homepage/ProgramCardsSection.tsx` | **Rewrite** — 4 slot cards editing `homepageFeatured` |
| `sanity/components/homepage/HomepageEditor.tsx`      | **Modify** — add `homepageFeatured` to document state |
| `sanity/components/homepage/HomepagePreview.tsx`     | **Modify** — consume `homepageFeatured` data          |
| `sanity/components/homepage/types.ts`                | **Modify** — add featured types                       |

### Config

| File               | Responsibility              |
| ------------------ | --------------------------- |
| `sanity.config.ts` | Register `navigationPlugin` |

## Shared Components to Reuse

- `BilingualInput` — for category rename and creation forms
- `ImagePickerPanel` — for hero image upload when creating categories
- `RightPanel` — right pane layout container
- `i18n.ts` (`i18nGet`, `i18nSet`) — for bilingual data manipulation
- Gallery panel's native HTML5 drag pattern — for category drag-and-drop reorder

## Out of Scope

- Page creation from the navigation tool
- Nav preview panel (removed — left panel overview is sufficient)
- Undo/redo
- Keyboard-only drag-and-drop accessibility (can be added later)
