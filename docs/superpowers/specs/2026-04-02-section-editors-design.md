# Section Editors Design

**Date:** 2026-04-02
**Scope:** Build Studio editors for `labelTable`, `infoCards`, `imageCards`, and `table` section types. All text on the site must be editable in Studio.

---

## Background

Four section types currently hit the "未対応" fallback in the custom Studio and are uneditable:

| Type         | Instances | Migrated From                                                                                                        |
| ------------ | --------- | -------------------------------------------------------------------------------------------------------------------- |
| `labelTable` | ~15+      | `infoTable`, single-date `eventSchedule`, `content` sub-fields, `fairTrade`                                          |
| `table`      | ~12       | `tableSchedule`, `history`, `boardMembers`, `directoryList`, `feeTable`, `groupSchedule`, multi-date `eventSchedule` |
| `infoCards`  | 2         | `definitions`                                                                                                        |
| `imageCards` | 1         | `sisterCities`                                                                                                       |

---

## Hard Requirement

**No text on the site should be uneditable in Studio.** Every field for every section type must be fully editable, including images in `imageCards` and the `note` field on `sisterCity` items (requires schema fix).

---

## Schema Fix: `sisterCity.note`

`sisterCity.note` is currently `type: "string"` (single language). This violates the hard requirement. Change to `internationalizedArrayString` and migrate the 1 production instance by wrapping the existing string into `[{_key:"ja", value:"<existing>"}, {_key:"en", value:""}]`.

## Schema Cleanup: Remove `hideTitle`

Remove `hideTitle` from all section schemas, TypeScript types, and renderer guards:

- **Schemas:** remove `hideTitle` field from `contentSection`, `labelTableSection`, `tableSection`, `infoCardsSection`, `imageCardsSection`, `linksSection`, `warningsSection`, `gallerySection` (any schema that has it)
- **Types:** remove `hideTitle?` from all section interfaces in `lib/types.ts`
- **Renderers:** change `if (s.title && !s.hideTitle)` → `if (s.title)` in all section renderers

**Pre-implementation check required:** Query production data for any section document with `hideTitle: true` AND a non-empty `title`. Those titles would become visible on the frontend after this change. Confirm with the user before deploying if any are found.

---

## Architecture

### New Files

Four new editor components in `sanity/components/pages/sections/`:

- `LabelTableSectionEditor.tsx`
- `InfoCardsSectionEditor.tsx`
- `ImageCardsSectionEditor.tsx`
- `TableSectionEditor.tsx`

### Routing

`SectionEditor.tsx` gets four new switch cases routing to these components. `GenericSectionEditor` is unchanged — `warnings` stays there, the "未対応" fallback remains for unknown types.

### Shared Primitive Change

`KeyValueListEditor` gets a new optional `placeholders` prop and an optional `fieldNames` prop to support different field names (`term`/`definition` vs `label`/`value`):

```typescript
placeholders?: {
  labelJa?: string;
  labelEn?: string;
  valueJa?: string;
  valueEn?: string;
}
fieldNames?: {
  label: string;  // default: "label"
  value: string;  // default: "value"
}
```

### Title Handling (All Four Types)

Each editor shows a `BilingualInput` for title labeled "タイトル（任意）". If left blank, nothing renders. The `hideTitle` field is removed entirely (see Schema Cleanup above).

### Column Types (`table` only)

The type dropdown is removed from the column form. All columns are treated as plain text. The `type` field remains in the schema (existing migrated data has types set) but is not exposed in the editor.

### Props Threading

`ImageCardsSectionEditor` receives `onOpenImagePicker` from `SectionEditor`. The callback is closed over with item index when calling it per-item.

---

## Editor Designs

### `LabelTableSectionEditor`

**Data shape:** `{ title?, hideTitle?, rows: { label: I18nString, value: I18nString }[] }`

**UI:**

- `BilingualInput` for title, labeled "タイトル（任意）"
- `KeyValueListEditor` with:
  - `labelHeader="ラベル"`, `valueHeader="値"`
  - `fieldNames={{ label: "label", value: "value" }}`
  - `placeholders={{ labelJa: "例：開催日時", labelEn: "e.g., Date & Time", valueJa: "例：毎週月曜日 10:00〜12:00", valueEn: "e.g., Every Monday 10:00–12:00" }}`
  - Add button: "＋ 行を追加"
  - New items get `_type: "infoRow"` injected on creation

---

### `InfoCardsSectionEditor`

**Data shape:** `{ title?, hideTitle?, items: { term: I18nString, definition: I18nString }[] }`

**UI:**

- `BilingualInput` for title, labeled "タイトル（任意）"
- `KeyValueListEditor` with:
  - `labelHeader="タイトル"`, `valueHeader="文章"`
  - `fieldNames={{ label: "term", value: "definition" }}`
  - `placeholders={{ labelJa: "例：在留資格", labelEn: "e.g., Residence Status", valueJa: "例：外国人が日本に滞在するための法的身分", valueEn: "e.g., Legal status required to stay in Japan" }}`
  - Add button: "＋ 項目を追加"
  - New items get `_type: "definition"` injected on creation

---

### `ImageCardsSectionEditor`

**Data shape:** `{ title?, hideTitle?, items: { name: I18nString, country: I18nString, image?: SanityImage, note?: I18nString }[] }`

**UI:**

- `BilingualInput` for title, labeled "タイトル（任意）"
- Vertical list of item cards. Each card shows:
  - Small image thumbnail (or gray placeholder "画像なし")
  - Japanese name text
  - Inline expand/collapse form (accordion style)
- Expanded form contains:
  - **画像**: thumbnail + "画像を変更" button → calls `onOpenImagePicker((assetId) => { items[i].image = { asset: { _ref: assetId } } })`. If no image: "画像を選択" button.
  - **名前**: `BilingualInput`, placeholders "例：パリ" / "e.g., Paris"
  - **国**: `BilingualInput`, placeholders "例：フランス" / "e.g., France"
  - **備考**: `BilingualInput`, placeholders "例：提携年 1965年" / "e.g., Sister city since 1965"
  - Trash icon to delete item
- Add button at bottom: "＋ カードを追加" — immediately expands blank form for new item

**Image picker pattern:**

```typescript
function handleImagePick(itemIndex: number) {
  onOpenImagePicker((assetId: string) => {
    const updated = [...items];
    updated[itemIndex] = { ...updated[itemIndex], image: { asset: { _ref: assetId } } };
    onUpdateField("items", updated);
  });
}
```

---

### `TableSectionEditor`

**Data shape:**

```typescript
{
  title?, hideTitle?, caption?,
  columns: { _key, label: I18nString, type?: ColumnType }[],
  rows: { _key, groupLabel?: I18nString, cells?: I18nString[] }[]
}
```

**UI — two sections:**

#### 列定義 (Column Definition)

Vertical list of column cards. Each card shows: Japanese label + type badge (e.g., "氏名 · テキスト"). Trash icon to delete.

"＋ 列を追加" opens inline form:

- `BilingualInput` for column label, placeholders "例：氏名" / "e.g., Name"
- "追加" + "キャンセル"

**Column deletion safety:**

- 0 data rows → delete immediately
- Data rows exist → confirmation dialog: "「[列名]」列を削除すると、全ての行からこの列のデータが削除されます。よろしいですか？"
- On confirm: remove column, trim that positional cell from every data row

**Column addition with existing rows:**

- Auto-append empty bilingual cell `[{_key:"ja",value:""},{_key:"en",value:""}]` to every existing data row
- No warning needed (no data lost)

#### 行 (Rows)

Hidden entirely when no columns exist. When columns = 0: muted text "先に列を定義してください".

Each row renders as a card:

- **Data row**: first column's Japanese value + "…"
- **Group header row**: Japanese label in bold, full-width, with "見出し" badge

Clicking a row opens its inline edit form (same as add form, pre-populated).

"＋ 行を追加" opens inline form:

- Checkbox: "グループ見出し行にする"
  - **Unchecked (default):** one `BilingualInput` per column, each labeled with that column's Japanese name + type badge
  - **Checked:** single `BilingualInput` labeled "見出し", placeholders "例：2026年度理事" / "e.g., Board Members 2026"; cell inputs hidden
- "追加" + "キャンセル"

**Toggling group header checkbox** in edit mode:

- Unchecked → checked: clears cells, populates empty groupLabel
- Checked → unchecked: clears groupLabel, auto-populates empty cells (one per column)

**Title and caption:**

- `BilingualInput` for title, labeled "タイトル（任意）"
- `BilingualInput` for caption, labeled "キャプション（任意）", placeholder "例：2026年3月現在" / "e.g., As of March 2026"

---

## No Reorder UI

No drag-to-reorder or up/down buttons anywhere. Editors add/delete to reorganize. This applies to: `labelTable` rows, `infoCards` items, `imageCards` items, `table` columns and rows.

---

## Out of Scope

- Column `type` field — not exposed in editor; existing migrated values preserved but untouched
- Hotspot/crop editing for `imageCards` images
- `gallery` section editor (already handled via right panel)
