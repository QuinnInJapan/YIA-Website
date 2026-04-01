# Unified Pages Tool — Design Spec

**Date:** 2026-04-01
**Status:** Approved

## Overview

Replace the two existing studio tools (ページ管理 and ナビゲーション) with a single unified **ページ** tool. The goal is a mental model that non-technical editors can understand without training: _pages live inside categories, you create and edit them in one place, and the nav on the site reflects what you set up here._

---

## Mental Model

From the user's perspective:

- A page has a **name** (Japanese + English), a **URL** (auto-generated from the English title), and a **category** (where it lives in the nav)
- A page is either **表示中** (visible on the site) or **非表示** (hidden)
- Page **content** (sections, images) and **nav structure** (order, show/hide) are two separate things that publish independently
- System pages (ブログ, お知らせ) exist but are not editable here

---

## Layout: 3 Panels

```
[ Left Panel ]  [ Middle Panel ]       [ Right Panel ]
  Tree nav        Page editor            Section tools
                  or Category mgmt       (page selected only)
```

The middle panel is always the primary work area and is never empty when something is selected:

- **Category selected** → middle panel shows category management
- **Page selected** → middle panel shows the page editor

---

## Left Panel — Category Tree

A collapsible tree of all categories and their pages.

```
[ナビの順番を変更]

▼ サービス
    日本語クラス        ● 表示中
    文化イベント        ● 表示中  ●(draft)

▼ イベント
    年間スケジュール    ○ 非表示

──────────────────
  ブログ              (システム)
  お知らせ            (システム)

[+ カテゴリを追加]
```

**Interactions:**

- **`[ナビの順番を変更]`** — toggles category drag mode. While active, category rows become draggable and the button label changes to `[完了]`. Clicking `[完了]` exits drag mode and **immediately publishes** the new category order to the navigation document (no separate publish step required).
- **Click a category header** — opens Category Management in the middle panel. Right panel becomes empty.
- **Click a page** — opens the page in the middle panel editor. Right panel shows section tools.
- **表示中/非表示 toggle** — inline on each page row. Immediately saves to navigation draft.
- **Draft indicator dot** — shown on page rows that have unpublished content changes.
- **`[+ カテゴリを追加]`** — at the bottom of the list. Opens category creation form in the right panel.
- **System pages** (ブログ, お知らせ) — shown at the bottom, visually separated. Clicking opens a read-only message in the right panel.

---

## Middle Panel — Page Editor

Opens when a page is selected in the left panel. Largely unchanged from the current ページ管理 editor.

```
[ページ名]                      [下書き保存中...] [公開する]

タイトル (日本語)  [                              ]
タイトル (英語)   [                              ]
サブタイトル (日本語) [                           ]
サブタイトル (英語)  [                            ]

ヒーロー画像      [画像を選択]

── セクション ────────────────────────────────────
  [+ セクションを追加]
  ...sections...

[下書きを破棄]
```

**Behavior:**

- Auto-saves drafts with debounce (1500ms)
- `[公開する]` publishes page content only — independent of nav structure publish
- `[下書きを破棄]` visible only when an unpublished draft exists
- After publish, the draft indicator dot on the left panel clears

---

## Middle Panel — Category Management

Opens when a category is selected in the left panel.

```
── サービス ──────────────────────────────────────

[カテゴリ画像を変更]

ページの並び順
  [並び替え]
  日本語クラス        ● 表示中
  文化イベント        ● 表示中

[+ ページを追加]

─────────────────────────────────────────────────
[カテゴリ名を変更]                           [削除]
```

- **`[並び替え]`** — toggles page drag mode within this category. While active, the button label changes to `[完了]`. Clicking `[完了]` exits drag mode and **immediately publishes** the new page order to the navigation document (no separate publish step required).
- **Show/hide toggles** — mirrored from the left panel. Changes saved to navigation draft.
- **`[+ ページを追加]`** — swaps this panel to the Page Creation form (see below).
- **`[カテゴリ名を変更]`** — inline rename. Updates both draft and published category document.
- **`[削除]`** — checks for references (homepageFeatured, etc.) before allowing deletion. Flushes pending saves before deleting the category document and removing from navigation.

When a category is selected, the right panel is empty.

---

## Right Panel — Section Tools

Active only when a page is selected. Same contextual tools as the current ページ管理 right panel: image picker, file picker, gallery editor, section picker, document detail panel, live preview.

When nothing is selected, the right panel is empty.

---

## Middle Panel — System Page Notice

When a system page (ブログ, お知らせ) is clicked in the left panel, the middle panel shows:

```
── ブログ ────────────────────────────────────────

このページはシステムで管理されています。
内容を編集するには、ブログ管理ツールをご利用ください。

[ブログ管理ツールへ →]
```

Links directly to the relevant studio tool. Same pattern for お知らせ.

---

## Middle Panel — Empty State

When nothing is selected: "左のパネルからページまたはカテゴリを選択してください。"

---

## Page Creation Flow

Triggered by `[+ ページを追加]` in the Category Management panel. The middle panel swaps to:

```
── 新しいページを作成 ────────────────────────────

英語タイトル   [                                 ]
               URL: /services/________________

日本語タイトル [                                 ]

作成後、非表示に設定されます。
内容を入力してから表示に切り替えてください。

               [キャンセル]  [作成する]
```

**Behavior:**

- English title is required and drives the slug — URL preview updates live as the user types
- Japanese title is required
- Slug is auto-generated (lowercase, hyphens, alphanumeric only) — not directly editable by the user. Changing the slug after creation is a developer task.
- On confirm:
  1. `page` document created with auto-generated slug
  2. Page added to the navigation under the selected category with `hidden: true`
  3. Left panel updates — new page appears with ○ 非表示
  4. Middle panel opens the new page for editing
  5. Right panel switches to section tools
- English title is mandated (not Japanese) because the slug derives from it

---

## Category Creation Flow

Triggered by `[+ カテゴリを追加]` at the bottom of the left panel. Right panel shows:

```
── 新しいカテゴリを作成 ──────────────────────────

カテゴリ名 (日本語)  [                           ]
カテゴリ名 (英語)   [                           ]

ヒーロー画像        [画像を選択]  (必須)

                    [キャンセル]  [作成する]
```

- Hero image is required (used on the homepage and category pages)
- Creates and immediately publishes the `category` document
- Adds it to the navigation document (as draft)
- New category appears in the left panel, collapsed, with no pages

---

## Navigation Draft/Publish

Not all navigation changes follow the same publish flow:

**Immediately published (no draft step):**

- Category reorder (via `[完了]` in drag mode)
- Page reorder within a category (via `[完了]` in drag mode)

**Saved as draft, require explicit publish:**

- Show/hide toggle (表示中/非表示) on a page
- Adding a page to a category (created as 非表示 by default)
- Removing a page from a category

A persistent publish bar appears at the bottom of the left panel when there are unpublished navigation changes:

```
[ ナビの変更があります ]          [公開する]
```

Publishing the navigation:

1. Writes the published `navigation` document
2. Syncs `categoryRef` on all affected `page` documents (same as current behavior)
3. Clears `categoryRef` on pages removed from categories

Navigation publish is independent of individual page content publishing.

---

## Data Model Changes

The existing schemas (`page`, `category`, `navigation`) are unchanged. The `slug` field remains `readOnly` in the schema — the creation flow sets it programmatically before the editor sees the page.

**Files to retire:**

- `sanity/components/pagesPlugin.ts`
- `sanity/components/PagesTool.tsx`
- `sanity/components/pages/PagesSidebar.tsx`
- `sanity/components/pages/PageEditor.tsx` (logic reused, component replaced)
- `sanity/components/NavigationTool.tsx`
- `sanity/components/navigation/NavigationEditor.tsx`
- `sanity/components/navigation/CategoryItem.tsx`
- `sanity/components/navigation/PageItem.tsx`
- `sanity/components/navigation/EditCategoryPanel.tsx`
- `sanity/components/navigation/AddPagePanel.tsx`
- `sanity/components/navigation/AddCategoryPanel.tsx`
- `sanity/components/navigation/RenameCategoryPanel.tsx`

**New plugin/components to build:**

- `sanity/components/unifiedPagesPlugin.ts` — plugin registration
- `sanity/components/UnifiedPagesTool.tsx` — 3-panel root
- `sanity/components/unified-pages/LeftPanel.tsx` — category tree
- `sanity/components/unified-pages/CategoryTree.tsx` — tree rendering
- `sanity/components/unified-pages/PageRow.tsx` — page row with draft indicator + show/hide
- `sanity/components/unified-pages/CategoryManagement.tsx` — middle panel: category selected
- `sanity/components/unified-pages/PageCreationForm.tsx` — middle panel: create page
- `sanity/components/unified-pages/CategoryCreationForm.tsx` — middle panel: create category (right panel of left panel)
- `sanity/components/unified-pages/SystemPageNotice.tsx` — middle panel: system page clicked
- `sanity/components/unified-pages/NavPublishBar.tsx` — pending nav changes banner
- `sanity/components/unified-pages/PageEditor.tsx` — middle panel (refactored from existing)
- `sanity/components/unified-pages/types.ts` — shared types

---

## Out of Scope

- Moving a page between categories (remove from current category, add to new one — existing behavior)
- Editing the URL/slug after page creation (developer task)
- Bulk operations (publish all, delete all, etc.)
- The Sanity desk structure (`structure.ts`) — remains as-is for developer use
