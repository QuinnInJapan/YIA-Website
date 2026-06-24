# テーブルセクション Editor — Right Panel Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the テーブル section editor out of the inline accordion and into the right panel, with a live preview and a spreadsheet-style bilingual cell grid.

**Architecture:** Mirrors the existing gallery editor pattern exactly. `PageEditor` gets `onOpenTableEditor` / `activeTableSectionKey` / `onDeselectTable` props; `UnifiedPagesTool` stores a `tableEditor` right-panel state and renders a new `TableEditorPanel` component inside `<RightPanel>`. The new component holds local state (columns, rows, title), calls `onUpdateField` on every change, and drives its own live preview with `SectionTable`.

**Tech Stack:** React (client components), Sanity UI (`TextInput`), `@sanity/icons` (`TrashIcon`), `next-sanity` (migration script), existing studio utilities (`i18nGet`, `i18nSet`, `table-utils.ts`).

---

## File Map

| Action | Path                                                      |
| ------ | --------------------------------------------------------- |
| Create | `scripts/migrate-remove-table-caption.ts`                 |
| Create | `sanity/components/pages/sections/TableEditorPanel.tsx`   |
| Modify | `sanity/schemas/tableSection.ts`                          |
| Modify | `lib/types.ts`                                            |
| Modify | `lib/section-renderers/table.tsx`                         |
| Modify | `sanity/components/unified-pages/PageEditor.tsx`          |
| Modify | `sanity/components/UnifiedPagesTool.tsx`                  |
| Modify | `sanity/components/pages/SectionEditor.tsx`               |
| Delete | `sanity/components/pages/sections/TableSectionEditor.tsx` |

---

## Task 1: Remove caption from schema, types, and renderer

**Files:**

- Modify: `sanity/schemas/tableSection.ts`
- Modify: `lib/types.ts`
- Modify: `lib/section-renderers/table.tsx`

- [ ] **Step 1: Remove caption defineField from the table schema**

In `sanity/schemas/tableSection.ts`, delete the entire `caption` field block (lines 25–30):

```diff
-    defineField({
-      name: "caption",
-      title: "キャプション",
-      type: "internationalizedArrayString",
-      description: "タイトル下に小さく表示する補足（例：「〇〇年〇月現在」）。任意。",
-    }),
```

The `fields` array should go directly from the `title` field to the `columns` field.

- [ ] **Step 2: Remove caption from the TableSection TypeScript type**

In `lib/types.ts`, remove the `caption` line from `TableSection`:

```typescript
export interface TableSection {
  _type: "table";
  title?: I18nString;
  columns: TableColumn[];
  rows: TableRow[];
}
```

- [ ] **Step 3: Remove caption rendering from the section renderer**

Replace the body of `lib/section-renderers/table.tsx` with:

```typescript
import type { TableSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import SectionTable from "@/components/SectionTable";

export const table: SectionHandler<TableSection> = (s, ctx) => {
  if (!s.columns?.length) {
    ctx.flush();
    return;
  }
  if (s.title) {
    ctx.addTocHeader(ja(s.title), en(s.title));
  }
  ctx.push(<SectionTable columns={s.columns} rows={s.rows ?? []} />);
  ctx.flush();
};
```

- [ ] **Step 4: Confirm TypeScript compiles clean**

```bash
npx tsc --noEmit
```

Expected: exit 0, no errors mentioning `caption` or `TableSection`.

- [ ] **Step 5: Commit**

```bash
git add sanity/schemas/tableSection.ts lib/types.ts lib/section-renderers/table.tsx
git commit -m "feat: remove caption field from table section schema, types, and renderer"
```

---

## Task 2: Write and run migration script

**Files:**

- Create: `scripts/migrate-remove-table-caption.ts`

- [ ] **Step 1: Create the migration script**

```typescript
/**
 * Unset `caption` from all table sections in existing page documents.
 *
 * Usage: npx tsx scripts/migrate-remove-table-caption.ts
 *
 * Safe to re-run — skips documents where no table section has a caption.
 */
import { createClient } from "next-sanity";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_TOKEN;

if (!projectId || !dataset || !token) {
  console.error(
    "Missing required env vars: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_TOKEN",
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

async function main() {
  // Fetch published + draft page docs that have at least one table section with a caption
  const docs = await client.fetch<
    { _id: string; sections: { _type: string; caption?: unknown }[] }[]
  >(
    `*[_type == "page" && defined(sections[_type == "table" && defined(caption)][0])] { _id, sections }`,
  );

  if (docs.length === 0) {
    console.log("No documents with table captions found. Nothing to do.");
    return;
  }

  let patched = 0;
  for (const doc of docs) {
    const unsetPaths: string[] = [];
    (doc.sections ?? []).forEach((section, i) => {
      if (section._type === "table" && section.caption != null) {
        unsetPaths.push(`sections[${i}].caption`);
      }
    });
    if (unsetPaths.length > 0) {
      await client.patch(doc._id).unset(unsetPaths).commit();
      console.log(`  Patched ${doc._id} — unset ${unsetPaths.join(", ")}`);
      patched++;
    }
  }

  console.log(`\nDone. Patched ${patched} document(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the migration**

```bash
npx tsx scripts/migrate-remove-table-caption.ts
```

Expected: prints `Done. Patched N document(s).` and exits 0. If N is 0, no existing data had captions — that's fine.

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate-remove-table-caption.ts
git commit -m "feat: add and run migration to remove caption from table section documents"
```

---

## Task 3: Build TableEditorPanel

**Files:**

- Create: `sanity/components/pages/sections/TableEditorPanel.tsx`

- [ ] **Step 1: Create the file with the complete component**

```tsx
"use client";

import { useState } from "react";
import { TextInput } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import SectionTable from "@/components/SectionTable";
import { i18nGet, i18nSet } from "../../shared/i18n";
import {
  emptyBilingual,
  padRowsForNewColumn,
  trimRowsForRemovedColumn,
  type I18nArr,
  type TableColumnDraft,
  type TableRowDraft,
} from "./table-utils";
import type { TableColumn, TableRow } from "@/lib/types";
import type { SectionItem } from "../types";

// ─── Shared styles ────────────────────────────────────────────────────────────

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "var(--card-muted-fg-color)",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const subLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "var(--card-muted-fg-color)",
  marginBottom: 3,
};

const cellInputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "3px 6px",
  border: "none",
  background: "transparent",
  fontSize: 11,
  fontFamily: "inherit",
  color: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const deleteButtonStyle: React.CSSProperties = {
  padding: 3,
  border: "none",
  background: "transparent",
  color: "var(--card-muted-fg-color)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 0,
};

const addRowButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: "5px 0",
  border: "1px dashed var(--card-border-color)",
  borderRadius: 3,
  background: "transparent",
  color: "var(--card-muted-fg-color)",
  fontSize: 11,
  cursor: "pointer",
};

// ─── Live preview ─────────────────────────────────────────────────────────────

function TablePreview({
  title,
  columns,
  rows,
}: {
  title: I18nArr;
  columns: TableColumnDraft[];
  rows: TableRowDraft[];
}) {
  const titleJa = i18nGet(title, "ja");
  return (
    <div
      style={{
        background: "#fff",
        color: "#333",
        padding: "8px 12px",
        fontSize: 14,
        lineHeight: 1.6,
        overflowX: "auto",
      }}
    >
      {titleJa && <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>{titleJa}</div>}
      <SectionTable
        columns={columns as unknown as TableColumn[]}
        rows={rows as unknown as TableRow[]}
      />
    </div>
  );
}

// ─── Column form (add / edit) ─────────────────────────────────────────────────

function ColumnForm({
  initialJa,
  initialEn,
  mode,
  onSave,
  onCancel,
}: {
  initialJa: string;
  initialEn: string;
  mode: "add" | "edit";
  onSave: (ja: string, en: string) => void;
  onCancel: () => void;
}) {
  const [ja, setJa] = useState(initialJa);
  const [en, setEn] = useState(initialEn);

  return (
    <div
      style={{
        border: "1px solid var(--card-focus-ring-color, #5b9cf6)",
        borderRadius: 4,
        padding: "8px 10px",
        background: "var(--card-code-bg-color)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div>
        <div style={subLabelStyle}>日本語</div>
        <TextInput autoFocus value={ja} onChange={(e) => setJa(e.currentTarget.value)} />
      </div>
      <div>
        <div style={subLabelStyle}>English</div>
        <TextInput value={en} onChange={(e) => setEn(e.currentTarget.value)} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          onClick={() => onSave(ja.trim(), en.trim())}
          disabled={!ja.trim()}
          style={{
            padding: "4px 12px",
            border: "1px solid var(--card-focus-ring-color, #5b9cf6)",
            borderRadius: 3,
            background: "var(--card-focus-ring-color, #5b9cf6)",
            color: "#fff",
            fontSize: 11,
            cursor: ja.trim() ? "pointer" : "not-allowed",
            opacity: ja.trim() ? 1 : 0.5,
          }}
        >
          {mode === "add" ? "追加" : "保存"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "4px 10px",
            border: "none",
            background: "transparent",
            color: "var(--card-muted-fg-color)",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

// ─── Column delete warning ─────────────────────────────────────────────────────

function ColumnDeleteWarning({
  colLabelJa,
  onConfirm,
  onCancel,
}: {
  colLabelJa: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        border: "1px solid #e05555",
        borderRadius: 4,
        padding: "8px 10px",
        background: "var(--card-code-bg-color)",
        display: "flex",
        flexDirection: "column",
        gap: 5,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: "#c03030" }}>
        「{colLabelJa}」列を削除しますか？
      </div>
      <div
        style={{
          fontSize: 10,
          color: "var(--card-muted-fg-color)",
          lineHeight: 1.5,
        }}
      >
        この列のデータが全ての行から削除されます。この操作は元に戻せません。
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          onClick={onConfirm}
          style={{
            padding: "4px 12px",
            border: "1px solid #e05555",
            borderRadius: 3,
            background: "#e05555",
            color: "#fff",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          削除する
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "4px 10px",
            border: "none",
            background: "transparent",
            color: "var(--card-muted-fg-color)",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

// ─── TableEditorPanel ─────────────────────────────────────────────────────────

type ColFormState =
  | { mode: "add" }
  | { mode: "edit"; index: number }
  | { mode: "deleteConfirm"; index: number }
  | null;

export function TableEditorPanel({
  section,
  onUpdateField,
  onClose,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState<I18nArr>((section.title as I18nArr) ?? emptyBilingual());
  const [columns, setColumns] = useState<TableColumnDraft[]>(
    (section.columns as TableColumnDraft[]) ?? [],
  );
  const [rows, setRows] = useState<TableRowDraft[]>((section.rows as TableRowDraft[]) ?? []);
  const [colForm, setColForm] = useState<ColFormState>(null);

  // ── Column operations ──────────────────────────────────────

  function saveNewColumn(ja: string, en: string) {
    const newCol: TableColumnDraft = {
      _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
      label: [
        { _key: "ja", value: ja },
        { _key: "en", value: en },
      ],
    };
    const nextCols = [...columns, newCol];
    const nextRows = padRowsForNewColumn(rows);
    setColumns(nextCols);
    setRows(nextRows);
    onUpdateField("columns", nextCols);
    onUpdateField("rows", nextRows);
    setColForm(null);
  }

  function saveEditColumn(index: number, ja: string, en: string) {
    const nextCols = columns.map((col, i) =>
      i !== index
        ? col
        : {
            ...col,
            label: [
              { _key: "ja", value: ja },
              { _key: "en", value: en },
            ],
          },
    );
    setColumns(nextCols);
    onUpdateField("columns", nextCols);
    setColForm(null);
  }

  function requestDeleteColumn(index: number) {
    const hasData = rows.some(
      (row) => !row.groupLabel && (row.cells?.[index] ?? []).some((c) => c.value !== ""),
    );
    if (!hasData) {
      const nextCols = columns.filter((_, i) => i !== index);
      const nextRows = trimRowsForRemovedColumn(rows, index);
      setColumns(nextCols);
      setRows(nextRows);
      onUpdateField("columns", nextCols);
      onUpdateField("rows", nextRows);
      setColForm(null);
    } else {
      setColForm({ mode: "deleteConfirm", index });
    }
  }

  function confirmDeleteColumn(index: number) {
    const nextCols = columns.filter((_, i) => i !== index);
    const nextRows = trimRowsForRemovedColumn(rows, index);
    setColumns(nextCols);
    setRows(nextRows);
    onUpdateField("columns", nextCols);
    onUpdateField("rows", nextRows);
    setColForm(null);
  }

  // ── Row operations ─────────────────────────────────────────

  function addDataRow() {
    const nextRows = [
      ...rows,
      {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        groupLabel: null,
        cells: Array.from({ length: columns.length }, () => emptyBilingual()),
      },
    ];
    setRows(nextRows);
    onUpdateField("rows", nextRows);
  }

  function addGroupRow() {
    const nextRows = [
      ...rows,
      {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        groupLabel: emptyBilingual(),
        cells: [],
      },
    ];
    setRows(nextRows);
    onUpdateField("rows", nextRows);
  }

  function deleteRow(index: number) {
    const nextRows = rows.filter((_, i) => i !== index);
    setRows(nextRows);
    onUpdateField("rows", nextRows);
  }

  function updateCell(rowIndex: number, colIndex: number, lang: "ja" | "en", value: string) {
    const nextRows = rows.map((row, ri) => {
      if (ri !== rowIndex) return row;
      const cells = [...(row.cells ?? [])];
      cells[colIndex] = i18nSet(cells[colIndex] ?? emptyBilingual(), lang, value) as I18nArr;
      return { ...row, cells };
    });
    setRows(nextRows);
    onUpdateField("rows", nextRows);
  }

  function updateGroupLabel(rowIndex: number, lang: "ja" | "en", value: string) {
    const nextRows = rows.map((row, ri) =>
      ri !== rowIndex
        ? row
        : {
            ...row,
            groupLabel: i18nSet(row.groupLabel ?? emptyBilingual(), lang, value) as I18nArr,
          },
    );
    setRows(nextRows);
    onUpdateField("rows", nextRows);
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid var(--card-border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              background: "var(--card-code-bg-color)",
              border: "1px solid var(--card-border-color)",
              borderRadius: 3,
              padding: "1px 5px",
            }}
          >
            テーブル
          </span>
          {i18nGet(title, "ja") || "（タイトルなし）"}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "2px 8px",
            border: "1px solid var(--card-border-color)",
            borderRadius: 4,
            background: "transparent",
            color: "var(--card-muted-fg-color)",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          閉じる
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: "12px 14px 40px",
          }}
        >
          {/* ① Live preview */}
          <div>
            <div style={sectionLabelStyle}>プレビュー</div>
            <div
              style={{
                border: "1px solid var(--card-border-color)",
                borderRadius: 4,
                overflow: "auto",
                maxHeight: 220,
              }}
            >
              <TablePreview title={title} columns={columns} rows={rows} />
            </div>
          </div>

          {/* ② Title */}
          <div>
            <div style={sectionLabelStyle}>タイトル（任意）</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div>
                <div style={subLabelStyle}>日本語</div>
                <TextInput
                  value={i18nGet(title, "ja")}
                  onChange={(e) => {
                    const next = i18nSet(title, "ja", e.currentTarget.value);
                    setTitle(next);
                    onUpdateField("title", next);
                  }}
                />
              </div>
              <div>
                <div style={subLabelStyle}>English</div>
                <TextInput
                  value={i18nGet(title, "en")}
                  onChange={(e) => {
                    const next = i18nSet(title, "en", e.currentTarget.value);
                    setTitle(next);
                    onUpdateField("title", next);
                  }}
                />
              </div>
            </div>
          </div>

          {/* ③ Column strip */}
          <div>
            <div style={sectionLabelStyle}>列定義</div>

            {/* Tags row */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 5,
                alignItems: "flex-start",
                marginBottom: colForm !== null ? 8 : 0,
              }}
            >
              {columns.map((col, i) => {
                const labelJa = i18nGet(col.label, "ja") || "（ラベルなし）";
                const labelEn = i18nGet(col.label, "en");
                const isEditing = colForm?.mode === "edit" && colForm.index === i;
                const isPendingDelete = colForm?.mode === "deleteConfirm" && colForm.index === i;

                return (
                  <div
                    key={col._key}
                    onClick={() => {
                      if (!isEditing && colForm === null) setColForm({ mode: "edit", index: i });
                    }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      padding: "4px 22px 4px 8px",
                      border: `${isEditing || isPendingDelete ? 2 : 1}px solid ${
                        isPendingDelete
                          ? "#e05555"
                          : isEditing
                            ? "var(--card-focus-ring-color, #5b9cf6)"
                            : "var(--card-border-color)"
                      }`,
                      borderRadius: 4,
                      background: "var(--card-code-bg-color)",
                      position: "relative",
                      cursor: colForm === null ? "pointer" : "default",
                      userSelect: "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: isPendingDelete ? "#c03030" : "var(--card-fg-color)",
                      }}
                    >
                      {labelJa}
                    </span>
                    {labelEn && (
                      <span
                        style={{
                          fontSize: 10,
                          color: isPendingDelete ? "#e08080" : "var(--card-muted-fg-color)",
                        }}
                      >
                        {labelEn}
                      </span>
                    )}
                    <button
                      type="button"
                      title="列を削除"
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDeleteColumn(i);
                      }}
                      style={{
                        position: "absolute",
                        top: 3,
                        right: 4,
                        padding: 0,
                        border: "none",
                        background: "transparent",
                        color: isPendingDelete ? "#e05555" : "var(--card-muted-fg-color)",
                        fontSize: 12,
                        lineHeight: 1,
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              {/* Add column */}
              <button
                type="button"
                onClick={() => {
                  if (colForm === null) setColForm({ mode: "add" });
                }}
                disabled={colForm !== null}
                style={{
                  padding: "4px 10px",
                  border: "1px dashed var(--card-border-color)",
                  borderRadius: 4,
                  background: "transparent",
                  color:
                    colForm !== null ? "var(--card-border-color)" : "var(--card-muted-fg-color)",
                  fontSize: 11,
                  cursor: colForm !== null ? "default" : "pointer",
                  height: 38,
                  alignSelf: "flex-start",
                }}
              >
                ＋ 列を追加
              </button>
            </div>

            {/* Form area (add / edit / delete-confirm) */}
            {colForm?.mode === "add" && (
              <ColumnForm
                initialJa=""
                initialEn=""
                mode="add"
                onSave={saveNewColumn}
                onCancel={() => setColForm(null)}
              />
            )}
            {colForm?.mode === "edit" && (
              <ColumnForm
                key={colForm.index}
                initialJa={i18nGet(columns[colForm.index]?.label, "ja")}
                initialEn={i18nGet(columns[colForm.index]?.label, "en")}
                mode="edit"
                onSave={(ja, en) => saveEditColumn(colForm.index, ja, en)}
                onCancel={() => setColForm(null)}
              />
            )}
            {colForm?.mode === "deleteConfirm" && (
              <ColumnDeleteWarning
                colLabelJa={i18nGet(columns[colForm.index]?.label, "ja") || "この列"}
                onConfirm={() => confirmDeleteColumn(colForm.index)}
                onCancel={() => setColForm(null)}
              />
            )}
          </div>

          {/* ④ Row grid */}
          {columns.length === 0 ? (
            <div
              style={{
                fontSize: 12,
                color: "var(--card-muted-fg-color)",
                fontStyle: "italic",
              }}
            >
              先に列を定義してください
            </div>
          ) : (
            <div>
              <div style={sectionLabelStyle}>行</div>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 12,
                    tableLayout: "fixed",
                    minWidth: columns.length * 100,
                  }}
                >
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col._key}
                          style={{
                            padding: "4px 6px",
                            border: "1px solid var(--card-border-color)",
                            textAlign: "left",
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--card-muted-fg-color)",
                            background: "var(--card-code-bg-color)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {i18nGet(col.label, "ja") || "—"}
                        </th>
                      ))}
                      <th
                        style={{
                          width: 28,
                          border: "1px solid var(--card-border-color)",
                          background: "var(--card-code-bg-color)",
                        }}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) =>
                      row.groupLabel != null ? (
                        /* Group header row */
                        <tr
                          key={row._key}
                          style={{
                            background: "rgba(200, 168, 75, 0.12)",
                          }}
                        >
                          <td
                            colSpan={columns.length}
                            style={{
                              border: "1px solid var(--card-border-color)",
                              padding: 0,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "3px 5px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  border: "1px solid #c8a84b",
                                  color: "#7a5800",
                                  borderRadius: 2,
                                  padding: "0 3px",
                                  flexShrink: 0,
                                }}
                              >
                                見出し
                              </span>
                              <input
                                type="text"
                                value={i18nGet(row.groupLabel, "ja")}
                                onChange={(e) => updateGroupLabel(rowIndex, "ja", e.target.value)}
                                placeholder="グループ名（日本語）"
                                style={cellInputStyle}
                              />
                              <span
                                style={{
                                  color: "var(--card-muted-fg-color)",
                                  fontSize: 10,
                                  flexShrink: 0,
                                }}
                              >
                                /
                              </span>
                              <input
                                type="text"
                                value={i18nGet(row.groupLabel, "en")}
                                onChange={(e) => updateGroupLabel(rowIndex, "en", e.target.value)}
                                placeholder="Group name (English)"
                                style={{
                                  ...cellInputStyle,
                                  color: "var(--card-muted-fg-color)",
                                }}
                              />
                            </div>
                          </td>
                          <td
                            style={{
                              border: "1px solid var(--card-border-color)",
                              textAlign: "center",
                              width: 28,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => deleteRow(rowIndex)}
                              style={deleteButtonStyle}
                              title="行を削除"
                            >
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      ) : (
                        /* Data row */
                        <tr key={row._key}>
                          {columns.map((col, colIndex) => {
                            const cell = row.cells?.[colIndex] ?? emptyBilingual();
                            return (
                              <td
                                key={col._key}
                                style={{
                                  border: "1px solid var(--card-border-color)",
                                  padding: 0,
                                  verticalAlign: "top",
                                }}
                              >
                                <input
                                  type="text"
                                  value={i18nGet(cell, "ja")}
                                  onChange={(e) =>
                                    updateCell(rowIndex, colIndex, "ja", e.target.value)
                                  }
                                  style={{
                                    ...cellInputStyle,
                                    borderBottom: "1px solid var(--card-border-color)",
                                  }}
                                />
                                <input
                                  type="text"
                                  value={i18nGet(cell, "en")}
                                  onChange={(e) =>
                                    updateCell(rowIndex, colIndex, "en", e.target.value)
                                  }
                                  style={{
                                    ...cellInputStyle,
                                    color: "var(--card-muted-fg-color)",
                                  }}
                                />
                              </td>
                            );
                          })}
                          <td
                            style={{
                              border: "1px solid var(--card-border-color)",
                              textAlign: "center",
                              verticalAlign: "middle",
                              width: 28,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => deleteRow(rowIndex)}
                              style={deleteButtonStyle}
                              title="行を削除"
                            >
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add row buttons */}
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button type="button" onClick={addDataRow} style={addRowButtonStyle}>
                  ＋ 行を追加
                </button>
                <button
                  type="button"
                  onClick={addGroupRow}
                  style={{
                    ...addRowButtonStyle,
                    borderColor: "#c8a84b",
                    color: "#7a5800",
                  }}
                >
                  ＋ グループ見出し
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors in `TableEditorPanel.tsx`.

- [ ] **Step 3: Commit**

```bash
git add sanity/components/pages/sections/TableEditorPanel.tsx
git commit -m "feat: add TableEditorPanel component"
```

---

## Task 4: Wire TableEditorPanel into PageEditor and UnifiedPagesTool

**Files:**

- Modify: `sanity/components/unified-pages/PageEditor.tsx`
- Modify: `sanity/components/UnifiedPagesTool.tsx`

- [ ] **Step 1: Add table editor props to PageEditor**

In `sanity/components/unified-pages/PageEditor.tsx`:

**A.** Add to the props interface (after `onDeselectGallery`):

```typescript
onOpenTableEditor?: (
  sectionKey: string,
  section: SectionItem,
  onUpdateField: (field: string, value: unknown) => void,
) => void;
activeTableSectionKey?: string | null;
onDeselectTable?: () => void;
```

**B.** Destructure the new props in the function signature (after `onDeselectGallery`):

```typescript
onOpenTableEditor,
activeTableSectionKey,
onDeselectTable,
```

**C.** Inside the `sections.map()` callback, add `isTable` alongside `isGallery` (after the `isGallery` line):

```typescript
const isTable = section._type === "table";
```

**D.** Update `isActive` to handle table sections:

```typescript
const isActive = isGallery
  ? activeGallerySectionKey === section._key
  : isTable
    ? activeTableSectionKey === section._key
    : expandedSection === section._key;
```

**E.** Replace `handleToggle` with the version that handles table sections:

```typescript
function handleToggle() {
  if (isGallery && onOpenGalleryEditor) {
    if (activeGallerySectionKey === section._key) {
      onDeselectGallery?.();
    } else {
      setExpandedSection(null);
      onOpenGalleryEditor(section._key, (section.images as GalleryImageItem[]) ?? [], (images) =>
        updateSection(index, "images", images),
      );
    }
  } else if (isTable && onOpenTableEditor) {
    if (activeTableSectionKey === section._key) {
      onDeselectTable?.();
    } else {
      setExpandedSection(null);
      onCloseRightPanel?.();
      onOpenTableEditor(section._key, section, (field, value) =>
        updateSection(index, field, value),
      );
    }
  } else {
    onCloseRightPanel?.();
    const next = expandedSection === section._key ? null : section._key;
    setExpandedSection(next);
    if (next !== null) setFocus(next);
    else clearFocus();
  }
}
```

**F.** Update the inline editor guard to also exclude table sections:

```typescript
{expandedSection === section._key && !isGallery && !isTable && (
  <SectionEditor ... />
)}
```

- [ ] **Step 2: Wire TableEditorPanel into UnifiedPagesTool**

In `sanity/components/UnifiedPagesTool.tsx`:

**A.** Add to the imports from `./pages/types`:

```typescript
import type { SectionTypeName, SectionItem } from "./pages/types";
```

**B.** Add `TableEditorPanel` import near the other panel imports:

```typescript
import { TableEditorPanel } from "./pages/sections/TableEditorPanel";
```

**C.** Add `tableEditor` to the `rightPanel` union type:

```typescript
| {
    type: "tableEditor";
    sectionKey: string;
    section: SectionItem;
    onUpdateField: (field: string, value: unknown) => void;
  }
```

**D.** Add `handleOpenTableEditor` callback alongside `handleOpenGalleryEditor`:

```typescript
const handleOpenTableEditor = useCallback(
  (
    sectionKey: string,
    section: SectionItem,
    onUpdateField: (field: string, value: unknown) => void,
  ) => {
    setRightPanel({ type: "tableEditor", sectionKey, section, onUpdateField });
  },
  [],
);
```

**E.** Pass the new props to `<PageEditor>`:

```tsx
onOpenTableEditor={handleOpenTableEditor}
activeTableSectionKey={
  rightPanel?.type === "tableEditor" ? rightPanel.sectionKey : null
}
onDeselectTable={() => setRightPanel(null)}
```

**F.** Add `tableEditor` to `renderRightPanel` — inside the `<RightPanel>` return block, add before the final `null`:

```tsx
) : rightPanel.type === "tableEditor" ? (
  <TableEditorPanel
    section={rightPanel.section}
    onUpdateField={rightPanel.onUpdateField}
    onClose={() => setRightPanel(null)}
  />
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 4: Verify in browser**

Run `npm run dev`, open `http://localhost:3000/studio`, navigate to a page with a テーブル section:

1. Click the テーブル section bar → right panel opens with `TableEditorPanel`. Section bar is highlighted. No inline expansion.
2. Edit the JA title → header text and preview update immediately.
3. Click ＋ 列を追加 → column form appears. Fill in JA name, click 追加 → column tag appears, row grid becomes visible.
4. Click a column tag → edit form opens pre-filled. Change JA name, click 保存 → tag updates.
5. Click × on a column with no row data → column disappears immediately.
6. Add a row via ＋ 行を追加 → empty row appears. Type in a cell → preview updates.
7. Click × on a column that has data in at least one row → red warning appears. Click キャンセル → nothing changes. Click × again → warning. Click 削除する → column and its data are removed.
8. Click ＋ グループ見出し → group header row appears with amber tint and 見出し badge.
9. Click 閉じる → panel closes, page preview returns.
10. Auto-save: after edits, the save status indicator in PageEditor should show "保存中…" then "保存済み".

- [ ] **Step 5: Commit**

```bash
git add sanity/components/unified-pages/PageEditor.tsx sanity/components/UnifiedPagesTool.tsx
git commit -m "feat: wire TableEditorPanel into PageEditor and UnifiedPagesTool right panel"
```

---

## Task 5: Cleanup

**Files:**

- Delete: `sanity/components/pages/sections/TableSectionEditor.tsx`
- Modify: `sanity/components/pages/SectionEditor.tsx`

- [ ] **Step 1: Delete TableSectionEditor.tsx**

```bash
rm sanity/components/pages/sections/TableSectionEditor.tsx
```

- [ ] **Step 2: Remove the table case from SectionEditor**

In `sanity/components/pages/SectionEditor.tsx`:

Remove the import:

```typescript
import { TableSectionEditor } from "./sections/TableSectionEditor";
```

Remove the case from `renderEditor()`:

```typescript
case "table":
  return <TableSectionEditor section={section} onUpdateField={onUpdateField} />;
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: exit 0. No references to `TableSectionEditor` remain anywhere in the codebase.

- [ ] **Step 4: Verify no regressions in browser**

1. Open a page with a テーブル section — confirm right panel still opens correctly.
2. Open a page with a コンテンツ section — confirm it still expands inline normally.
3. Open a page with a ラベルテーブル section — confirm it still expands inline normally.

- [ ] **Step 5: Commit**

```bash
git add sanity/components/pages/SectionEditor.tsx
git rm sanity/components/pages/sections/TableSectionEditor.tsx
git commit -m "chore: delete TableSectionEditor and remove table case from SectionEditor"
```
