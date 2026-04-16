# Design: テーブルセクション Editor — Right Panel Redesign

## Context

The テーブル section editor is the most complex editor in the studio. Editing it inline inside the section accordion produces a cramped, hard-to-use experience: column definitions, row forms, and bilingual inputs all stacked in a narrow panel.

The goal is to move the テーブル editor to the right panel — the same surface used for the gallery editor — where it has more room, a live preview, and a proper spreadsheet-style grid.

## Trigger / Opening

Clicking a テーブル section bar opens the table editor in the right panel. This follows the exact same mechanism as the gallery editor:

- `PageEditor` gains an `onOpenTableEditor` prop (parallel to `onOpenGalleryEditor`)
- When `handleToggle` runs for a `table` section, it calls `onOpenTableEditor` instead of expanding the section inline
- The section bar renders as "active" (same `isActive` logic as gallery) while the panel is open
- Clicking ✕ or opening another right panel closes it and returns to the page preview
- テーブル sections never expand inline; the `table` case in `SectionEditor` is kept but never reached

## Panel Layout

Top to bottom, all in a single scrollable column:

1. **Header** — section type badge ("テーブル") + JA title of the section + ✕ close button
2. **Live preview** — renders the actual `SectionTable` component using local panel state; updates instantly as edits happen (no save debounce)
3. **Title field** — bilingual stacked inputs: 日本語 (bold label) / English (muted label). No caption field.
4. **Column strip + form** — column tag row, add/edit/delete form area below
5. **Row grid** — spreadsheet table with bilingual sub-rows per cell

## Column Strip

Each defined column is shown as a tag containing its JA name (bold) and EN name (muted). A ＋ 列を追加 button sits at the end of the row.

### Add / Edit Form

Clicking ＋ 列を追加 or clicking an existing tag opens a form in the area below the strip. Only one form is open at a time — opening a new one closes the previous.

Form fields:

- 日本語 text input (focused on open)
- English text input

Buttons:

- **追加** (when adding) or **保存** (when editing an existing column) — saves and closes form
- **キャンセル** — discards and closes form

When editing, the tag that's being edited is highlighted with a blue border while the form is open.

### Column Delete

Clicking × on a column tag:

- **If the column has no data in any row** → deletes immediately, no warning
- **If any row has data in that column** → a warning form appears in the same zone below the strip, replacing any open add/edit form:
  - Red border, the tag highlights in red
  - Message: "「[列名]」列を削除しますか？この列のデータが全ての行から削除されます。"
  - Buttons: **削除する** (destructive, red) + **キャンセル**
  - On confirm: removes the column and clears that column's cells from all rows

## Row Grid

### Header row

Shows JA column names only as column headers (no EN in headers). Rightmost column is a fixed-width delete column with no header text.

### Data rows

Each cell contains two stacked sub-inputs separated by a hairline divider:

- Top: JA input
- Bottom: EN input (muted placeholder color)

Clicking a cell focuses the JA input. Tab moves focus to the next sub-input or next cell. Inputs auto-size vertically with content (no fixed height).

### Group header rows

Span all data columns. Amber tint background. Contents: a 見出し badge + JA text input + "/" + EN text input inline. Delete button on the right.

### Footer

Two buttons below the grid:

- ＋ 行を追加 — adds a new empty data row
- ＋ グループ見出し — adds a new group header row

## Architecture

### New component: `TableEditorPanel`

**File:** `sanity/components/pages/sections/TableEditorPanel.tsx`

- Receives `section: SectionItem` (snapshot at open time) and `onUpdateField: (field, value) => void`
- Holds local state for `title`, `columns`, and `rows`
- Calls `onUpdateField` on every change (auto-save debounce handled upstream by `PageEditor`)
- Renders the live preview using the local state directly (bypasses the save debounce)
- The preview wraps the existing `SectionTable` component via the `renderSections` pipeline

### `UnifiedPagesTool` changes

- Adds `tableEditor` variant to the `rightPanel` union: `{ type: "tableEditor"; sectionKey: string; section: SectionItem; onUpdateField: (field, value) => void }`
- Adds `handleOpenTableEditor` callback (parallel to `handleOpenGalleryEditor`)
- Adds `activeTableSectionKey` derived from `rightPanel`
- Renders `<TableEditorPanel>` inside `<RightPanel>` when `rightPanel.type === "tableEditor"`

### `PageEditor` changes

- Adds `onOpenTableEditor` prop (parallel to `onOpenGalleryEditor`)
- Adds `onDeselectTable` prop and `activeTableSectionKey` prop for section bar active state
- `handleToggle` for `table` sections calls `onOpenTableEditor` instead of expanding inline

### `SectionEditor` changes

Remove the `table` case from the switch statement. It was never reached after this change and keeping dead code is confusing.

### `TableSectionEditor.tsx`

Delete the file. It is fully superseded by `TableEditorPanel.tsx`.

### Caption field

The `caption` field is removed from the editor UI. Existing `caption` data already stored in documents is preserved in Sanity and continues to render on the frontend — it is simply no longer editable via the studio after this change.

## Verification

1. Open the studio and navigate to a page with a テーブル section.
2. Click the テーブル section bar → right panel opens with the table editor. Section bar shows as active. Section does not expand inline.
3. Live preview renders and matches the current section data.
4. Edit the title (JA or EN) → preview updates instantly.
5. Click a column tag → edit form appears pre-filled with 保存 / キャンセル. Save updates the tag.
6. Click ＋ 列を追加 → empty form appears with 追加 / キャンセル. Add a column → it appears in the strip and as a new column in the grid.
7. Click × on a column with no row data → deletes immediately.
8. Click × on a column that has data → warning form appears. Cancel → nothing changes. 削除する → column and its data are removed from all rows.
9. Click a cell in the row grid → JA input focused. Tab → moves to EN input. Tab again → moves to next cell.
10. Click ＋ 行を追加 → new empty row appears at the bottom of the grid.
11. Click ＋ グループ見出し → new group header row appears.
12. Click ✕ → panel closes, page preview returns.
13. Open another right panel (e.g., image picker) while table editor is open → table editor closes gracefully.
14. No regressions in other section types.
