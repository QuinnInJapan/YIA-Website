# ラベルテーブル Editor Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the ラベルテーブル section editor to use a flat CSS grid table with aligned bilingual headers and stacked title inputs.

**Architecture:** Three targeted edits across two shared components and one section editor. No new files. `BilingualInput` gets a vertical layout. `KeyValueListEditor` gets a grid-based table structure replacing the per-row border-box layout. `LabelTableSectionEditor` drops the redundant `label` prop.

**Tech Stack:** React, inline styles (existing pattern), Sanity UI (`TextInput`, `TrashIcon`)

---

### Task 1: Stack BilingualInput vertically

**Files:**

- Modify: `sanity/components/shared/BilingualInput.tsx`

- [ ] **Step 1: Change the flex container from row to column**

In `BilingualInput.tsx`, replace the inner wrapper div (line 22):

```tsx
// Before
<div style={{ display: "flex", gap: 8 }}>

// After
<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
```

The "日本語" and "English" label divs above each `TextInput` are already present in the component — no changes needed there.

- [ ] **Step 2: Verify in Studio**

Run `npm run dev` (or the existing dev command) and open the Sanity Studio. Navigate to any section editor that uses a title field (e.g., ラベルテーブル). Confirm:

- 日本語 input appears above English input (stacked)
- "日本語" label text is visible above the first input
- "English" label text is visible above the second input
- Placeholders are still present as hints

- [ ] **Step 3: Commit**

```bash
git add sanity/components/shared/BilingualInput.tsx
git commit -m "fix: stack BilingualInput vertically to fit narrow studio layout"
```

---

### Task 2: Redesign KeyValueListEditor to CSS grid table

**Files:**

- Modify: `sanity/components/shared/KeyValueListEditor.tsx`

- [ ] **Step 1: Make the `label` prop optional**

Update the props interface (around line 62) to make `label` optional:

```tsx
export function KeyValueListEditor({
  label,
  labelHeader = "ラベル",
  valueHeader = "値",
  fieldNames = { label: "label", value: "value" },
  placeholders,
  addLabel = "+ 行を追加",
  items,
  onChange,
}: {
  label?: string; // was: label: string
  labelHeader?: string;
  valueHeader?: string;
  fieldNames?: { label: string; value: string };
  placeholders?: {
    labelJa?: string;
    labelEn?: string;
    valueJa?: string;
    valueEn?: string;
  };
  addLabel?: string;
  items: KeyValueItem[];
  onChange: (items: KeyValueItem[]) => void;
});
```

- [ ] **Step 2: Replace the outer label div with nothing (it's unused when label is absent)**

Remove the outer label div (around line 123–127) that currently renders `{label}`:

```tsx
// Delete this block:
<div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>{label}</div>
```

- [ ] **Step 3: Replace the items list with a grid table**

Replace the entire `{items.length > 0 && (...)}` block (lines 128–196) with the following. This renders a bordered table with a bilingual header row followed by data rows, each using a 3-column × 2-row grid:

```tsx
{
  items.length > 0 && (
    <div
      style={{
        border: "1px solid var(--card-border-color)",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 8,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.6fr 24px",
          gridTemplateRows: "auto auto",
          background: "var(--card-bg2-color, var(--card-border-color))",
          borderBottom: "1px solid var(--card-border-color)",
        }}
      >
        <div
          style={{
            gridColumn: 1,
            gridRow: 1,
            padding: "5px 8px",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--card-fg-color)",
            borderRight: "1px solid var(--card-border-color)",
            borderBottom: "1px solid var(--card-border-color)",
          }}
        >
          {labelHeader}
        </div>
        <div
          style={{
            gridColumn: 2,
            gridRow: 1,
            padding: "5px 8px",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--card-fg-color)",
            borderBottom: "1px solid var(--card-border-color)",
          }}
        >
          {valueHeader}
        </div>
        <div style={{ gridColumn: 3, gridRow: "1 / span 2" }} />
        <div
          style={{
            gridColumn: 1,
            gridRow: 2,
            padding: "5px 8px",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--card-muted-fg-color)",
            borderRight: "1px solid var(--card-border-color)",
          }}
        >
          {labelHeader === "ラベル" ? "Label" : labelHeader}
        </div>
        <div
          style={{
            gridColumn: 2,
            gridRow: 2,
            padding: "5px 8px",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--card-muted-fg-color)",
          }}
        >
          {valueHeader === "値" ? "Value" : valueHeader}
        </div>
      </div>

      {/* Data rows */}
      {items.map((item, index) => (
        <div
          key={item._key as string}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.6fr 24px",
            gridTemplateRows: "auto auto",
            borderBottom:
              index < items.length - 1 ? "1px solid var(--card-border-color)" : undefined,
          }}
        >
          {/* Japanese label input */}
          <div
            style={{
              gridColumn: 1,
              gridRow: 1,
              padding: "6px 8px 3px",
              borderRight: "1px solid var(--card-border-color)",
            }}
          >
            <TextInput
              fontSize={0}
              value={i18nGet(getI18n(item, labelField), "ja")}
              placeholder={placeholders?.labelJa}
              onChange={(e) => updateItem(index, labelField, "ja", e.currentTarget.value)}
            />
          </div>

          {/* Japanese value textarea */}
          <div style={{ gridColumn: 2, gridRow: 1, padding: "6px 8px 3px" }}>
            <AutoTextarea
              value={i18nGet(getI18n(item, valueField), "ja")}
              placeholder={placeholders?.valueJa}
              onChange={(text) => updateItem(index, valueField, "ja", text)}
            />
          </div>

          {/* Delete button — spans both rows */}
          <button
            type="button"
            onClick={() => removeItem(index)}
            title="削除"
            style={{
              gridColumn: 3,
              gridRow: "1 / span 2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: "transparent",
              color: "var(--card-muted-fg-color)",
              cursor: "pointer",
            }}
          >
            <TrashIcon />
          </button>

          {/* English label input */}
          <div
            style={{
              gridColumn: 1,
              gridRow: 2,
              padding: "3px 8px 6px",
              borderRight: "1px solid var(--card-border-color)",
            }}
          >
            <TextInput
              fontSize={0}
              value={i18nGet(getI18n(item, labelField), "en")}
              placeholder={placeholders?.labelEn}
              onChange={(e) => updateItem(index, labelField, "en", e.currentTarget.value)}
            />
          </div>

          {/* English value textarea */}
          <div style={{ gridColumn: 2, gridRow: 2, padding: "3px 8px 6px" }}>
            <AutoTextarea
              value={i18nGet(getI18n(item, valueField), "en")}
              placeholder={placeholders?.valueEn}
              onChange={(text) => updateItem(index, valueField, "en", text)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Verify in Studio**

Open the Studio and navigate to a page with a ラベルテーブル section. Confirm:

- Table header appears once at the top with "ラベル" / "値" (Japanese, bold) and "Label" / "Value" (English, muted) in the same grid rows as the data inputs they label
- Japanese label input aligns horizontally with Japanese value input
- English label input aligns horizontally with English value input
- Delete button is vertically centered between both input rows
- No border box per row — only a thin divider line between rows
- Adding a new row with "+ 行を追加" applies the same grid layout
- Editing values updates correctly (no regressions in data binding)

- [ ] **Step 5: Commit**

```bash
git add sanity/components/shared/KeyValueListEditor.tsx
git commit -m "feat: redesign KeyValueListEditor as CSS grid table with bilingual aligned headers"
```

---

### Task 3: Remove redundant `label` prop from LabelTableSectionEditor

**Files:**

- Modify: `sanity/components/pages/sections/LabelTableSectionEditor.tsx`

- [ ] **Step 1: Remove the `label` prop**

In `LabelTableSectionEditor.tsx`, remove the `label="行"` prop from the `KeyValueListEditor` call:

```tsx
// Before
<KeyValueListEditor
  label="行"
  labelHeader="ラベル"
  ...

// After
<KeyValueListEditor
  labelHeader="ラベル"
  ...
```

- [ ] **Step 2: Verify in Studio**

Confirm no section heading "行" appears above the table. The table header communicates structure on its own.

- [ ] **Step 3: Commit**

```bash
git add sanity/components/pages/sections/LabelTableSectionEditor.tsx
git commit -m "fix: remove redundant 行 label from LabelTableSectionEditor"
```
