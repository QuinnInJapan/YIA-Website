# Custom Sanity Studio Navigation & Featured Plugin — Wave 2

**Date:** 2026-03-31
**Scope:** Custom Sanity Studio plugin for navigation management + updated homepage editor Programs section. Builds on Wave 1 schemas (`navigation`, `homepageFeatured`, `category`).

## Problem

Wave 1 created the data model for flexible navigation and homepage featured categories, but admins currently edit these through Sanity's raw auto-generated forms. Non-technical users need a purpose-built interface that makes the mental model clear (what's a category vs. a page) and lets them see the consequences of their changes in real time.

## Requirements

1. Standalone navigation tool in the Studio sidebar for managing the navbar
2. Two-pane layout: structural editor (left) + live nav preview (right)
3. Category CRUD: create, rename, delete — with contextual delete protection if featured on homepage
4. Assign existing pages to categories (no page creation from this tool)
5. Reorder categories and pages within categories via up/down arrow buttons (no drag-and-drop)
6. Toggle page visibility (hidden/shown) with immediate preview feedback
7. Updated Programs section in the homepage editor for `homepageFeatured` slot management
8. Cross-document awareness is contextual only — navigation data fetched when opening a page picker in the homepage editor, `homepageFeatured` checked only on category delete in the nav tool
9. Clear UX copy that reinforces the mental model for non-technical users
10. Follow existing plugin patterns: tool-based, `useClient`, auto-save with debounce, bilingual support, draft/publish workflow

## Architecture

Two independent editing surfaces with lazy cross-references:

- **Navigation tool** (new standalone plugin): manages the `navigation` document and `category` documents. Two-pane layout with structural editor and live navbar preview.
- **Homepage editor** (existing, modified): the Programs section is rewritten to manage the `homepageFeatured` document instead of filtering by hero image. Category/page pickers fetch navigation data only when opened.

Both follow the established plugin pattern from `HomepageTool.tsx` / `HomepageEditor.tsx`.

## Navigation Tool

### Left Pane — Structural Editor

Top bar with tool title and save/publish button.

**Category list:**

- Each category is a collapsible row showing:
  - Up/down arrow buttons for reordering
  - Category label (Japanese, English subtitle)
  - "Rename" action — inline edit of bilingual labels using the existing `BilingualInput` component
  - "Delete" action — two-step: first removes the category from the `navigation` document's array, then deletes the `category` document. Before starting, checks `homepageFeatured` contextually; blocks with message if referenced.
  - Expand/collapse to reveal page list
- "Add category" button at the bottom — opens inline form for bilingual label + hero image upload. Hero image uses the existing `ImagePickerPanel` in the right pane (right pane toggles between preview and picker, following the `HomepageTool.tsx` pattern). Creates a new `category` document (auto-generated ID), publishes it immediately, and adds a reference to the `navigation` document.

**Page items within each category:**

- Page title (Japanese + English)
- Visibility toggle (eye icon — on/off for `hidden` field)
- Up/down arrow buttons for reordering within the category
- Remove button (removes page from this category's nav items; does not delete the page document)
- "Add page" button at the bottom of each category — opens a picker of all existing page documents, filtered to exclude pages already in this category (a page may appear in multiple categories; the page's `categoryRef` field controls desk structure/URL routing, while the navigation array controls navbar display — these are intentionally independent)

### Right Pane — Live Nav Preview

A cosmetic preview component that visually represents the navbar layout. Not functional — no working links or dropdown interactions. Shows category names and visible page titles in the same visual structure as the site navbar. Updates reactively as the user makes changes in the left pane. Hidden pages are omitted so the user sees the actual nav result. Uses the existing `PreviewPanel` wrapper from shared components.

### Data Flow

- Fetches `navigation` document on load (published + draft)
- Edits go through `pendingEdits` → 1500ms debounced auto-save (existing pattern)
- Category CRUD operates on `category` documents directly via Sanity client
- On category delete: fetches `homepageFeatured` to check if referenced. If so, shows warning and blocks. Otherwise: (1) removes category from `navigation` array and saves, (2) deletes the `category` document. Two-step because Sanity's reference integrity blocks deletion of referenced documents.
- Publish via `transaction.createOrReplace()` + delete draft
- Right pane toggles between nav preview (default) and image picker (when adding a category), following the state machine pattern from `HomepageTool.tsx`

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

- Tool title: "ナビゲーション" / "サイトのメニューを管理します (Manage the site menu)"
- Categories: "メニューグループ (Menu groups)"
- Pages: "ページ (Pages)"
- Visibility toggle: "ナビに表示 (Show in nav)"
- Delete category confirmation: "このメニューグループを削除しますか？グループ内のページは削除されません。(Delete this menu group? Pages within it will not be deleted.)"
- Featured delete blocked: "このカテゴリーはホームページで使用中のため削除できません。(This category is used on the homepage and cannot be deleted.)"

**Homepage Programs section:**

- Section heading: "注目カテゴリー (Featured Categories)"
- Slot labels: "スロット 1-4"
- Page picker: "表示するページを選択（最大4件）(Select pages to display, max 4)"

Copy can be refined after initial implementation.

## File Structure

### Navigation tool (new)

| File                                                | Responsibility                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| `sanity/components/navigationPlugin.ts`             | Plugin definition                                                   |
| `sanity/components/NavigationTool.tsx`              | Two-pane wrapper (editor + preview)                                 |
| `sanity/components/navigation/NavigationEditor.tsx` | Category list, page items, CRUD operations                          |
| `sanity/components/navigation/NavPreview.tsx`       | Live navbar preview                                                 |
| `sanity/components/navigation/CategoryItem.tsx`     | Single category row: expand/collapse, rename, delete, arrow reorder |
| `sanity/components/navigation/PageItem.tsx`         | Single page row: visibility toggle, arrow reorder                   |
| `sanity/components/navigation/types.ts`             | TypeScript interfaces                                               |

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

These existing components from `sanity/components/shared/` should be reused:

- `BilingualInput` — for category rename and creation forms
- `ImagePickerPanel` — for hero image upload when creating categories
- `RightPanel` — right pane layout container
- `PreviewPanel` — preview pane wrapper
- `i18n.ts` (`i18nGet`, `i18nSet`) — for bilingual data manipulation

## Out of Scope

- Page creation from the navigation tool
- Drag-and-drop reordering (using arrow buttons instead)
- Moving pages between categories via drag (remove + add is sufficient)
- Undo/redo
- Functional nav preview (preview is cosmetic only — shows layout, doesn't need working links or dropdowns)
