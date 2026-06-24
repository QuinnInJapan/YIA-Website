# Design: ラベルテーブル Editor Redesign

## Context

The current ラベルテーブル section editor suffers from two UX problems:

1. Each row is wrapped in its own border box, creating visually noisy nesting (box within box).
2. Column headers (ラベル/値) repeat on every row instead of appearing once, and are not language-aligned — the user can't tell which input is Japanese vs. English at a glance.

The goal is a flat table layout where structure is communicated through column headers and row dividers, not nested borders.

## Design

### Title input (`BilingualInput`)

Change the 日本語 / English inputs from side-by-side to **vertically stacked**. The horizontal layout is too wide for the available space and the cutoff misaligns with the table below it.

Change: replace `display: flex; gap: 8` with `display: flex; flex-direction: column; gap: 5px` in `BilingualInput`.

Each input must retain its visible text label ("日本語" / "English") above it — already present in the current component as small muted divs. Do not rely on placeholder text as the only indicator of which language an input is for. Placeholders remain as content hints only.

Since `BilingualInput` is shared across all section editors and narrow space is a general constraint, change the default layout globally. No new prop needed.

**File:** `sanity/components/shared/BilingualInput.tsx`

### Row layout (`KeyValueListEditor`)

Replace the current per-row border-box layout with a **CSS grid table**:

**Header row** — appears once, uses the same `grid-template-columns` as data rows:

```
grid-template-columns: 1fr 1.6fr 24px
grid-template-rows: auto auto
```

- grid (col 1, row 1): "ラベル" — bold, aligns with Japanese label input
- grid (col 1, row 2): "Label" — muted, aligns with English label input
- grid (col 2, row 1): "値" — bold, aligns with Japanese value input
- grid (col 2, row 2): "Value" — muted, aligns with English value input
- grid (col 3, rows 1–2): empty

**Data rows** — same grid structure per row:

- grid (col 1, row 1): Japanese label input
- grid (col 1, row 2): English label input
- grid (col 2, row 1): Japanese value textarea (auto-expanding)
- grid (col 2, row 2): English value textarea (auto-expanding)
- grid (col 3, rows 1–2 span): delete button, centered vertically

Rows separated by `border-bottom: 1px solid var(--card-border-color)`. No border box per row.

The outer section label ("行") is removed — the table header makes the structure self-evident. Remove the `label` prop usage from `LabelTableSectionEditor`, or make it optional and pass nothing.

**File:** `sanity/components/shared/KeyValueListEditor.tsx`
**File:** `sanity/components/pages/sections/LabelTableSectionEditor.tsx` (remove `label="行"` prop)

## Verification

1. Open the Sanity Studio and navigate to any page that has a ラベルテーブル section.
2. Confirm: title inputs are stacked vertically with no side-by-side cutoff.
3. Confirm: table column headers appear once at the top (ラベル / Label, 値 / Value).
4. Confirm: Japanese inputs visually align horizontally across label and value columns.
5. Confirm: English inputs visually align horizontally across label and value columns.
6. Confirm: delete button is centered between both rows.
7. Confirm: adding a new row works, and the grid layout applies to the new row.
8. Confirm: no visual regressions in other section editors that use `BilingualInput`.
