"use client";

import { TextInput } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import { BilingualInput } from "../../shared/BilingualInput";
import { i18nGet, i18nSet } from "../../shared/i18n";
import type { SectionItem } from "../types";

interface CellItem {
  _key: string;
  text?: { _key: string; value: string }[] | null;
}

interface RowItem {
  _key: string;
  cells?: CellItem[];
}

export function TableScheduleSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  const columns = (section.columns as string[]) ?? [];
  const columnsEn = (section.columnsEn as string[]) ?? [];
  const rows = (section.rows as RowItem[]) ?? [];

  function updateCell(rowIndex: number, cellIndex: number, lang: string, text: string) {
    const updated = [...rows];
    const cells = [...(updated[rowIndex].cells ?? [])];
    cells[cellIndex] = {
      ...cells[cellIndex],
      text: i18nSet(cells[cellIndex]?.text, lang, text),
    };
    updated[rowIndex] = { ...updated[rowIndex], cells };
    onUpdateField("rows", updated);
  }

  return (
    <>
      <BilingualInput
        label="タイトル"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />

      {/* Columns */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
          列名（日本語）
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {columns.map((col, i) => (
            <TextInput
              key={i}
              fontSize={0}
              value={col}
              style={{ width: 120 }}
              onChange={(e) => {
                const updated = [...columns];
                updated[i] = e.currentTarget.value;
                onUpdateField("columns", updated);
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => onUpdateField("columns", [...columns, ""])}
            style={{
              padding: "4px 8px",
              border: "1px dashed var(--card-border-color)",
              borderRadius: 4,
              background: "transparent",
              color: "var(--card-muted-fg-color)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
          列名（English）
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {columnsEn.map((col, i) => (
            <TextInput
              key={i}
              fontSize={0}
              value={col}
              style={{ width: 120 }}
              onChange={(e) => {
                const updated = [...columnsEn];
                updated[i] = e.currentTarget.value;
                onUpdateField("columnsEn", updated);
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => onUpdateField("columnsEn", [...columnsEn, ""])}
            style={{
              padding: "4px 8px",
              border: "1px dashed var(--card-border-color)",
              borderRadius: 4,
              background: "transparent",
              color: "var(--card-muted-fg-color)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Rows */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>行</div>
        {rows.map((row, ri) => (
          <div
            key={row._key}
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 6,
              padding: "6px 8px",
              border: "1px solid var(--card-border-color)",
              borderRadius: 4,
              alignItems: "start",
            }}
          >
            <div style={{ flex: 1, display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(row.cells ?? []).map((cell, ci) => (
                <div key={cell._key} style={{ minWidth: 100, flex: 1 }}>
                  <div
                    style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}
                  >
                    {columns[ci] ?? `列${ci + 1}`}
                  </div>
                  <TextInput
                    fontSize={0}
                    value={i18nGet(cell.text, "ja")}
                    onChange={(e) => updateCell(ri, ci, "ja", e.currentTarget.value)}
                    style={{ marginBottom: 2 }}
                  />
                  <TextInput
                    fontSize={0}
                    value={i18nGet(cell.text, "en")}
                    placeholder="EN"
                    onChange={(e) => updateCell(ri, ci, "en", e.currentTarget.value)}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateField(
                  "rows",
                  rows.filter((_, idx) => idx !== ri),
                )
              }
              style={{
                padding: 4,
                border: "none",
                background: "transparent",
                color: "var(--card-muted-fg-color)",
                cursor: "pointer",
                marginTop: 12,
              }}
            >
              <TrashIcon />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const numCols = Math.max(columns.length, 1);
            const cells = Array.from({ length: numCols }, () => ({
              _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
              text: [
                { _key: "ja", value: "" },
                { _key: "en", value: "" },
              ],
            }));
            onUpdateField("rows", [
              ...rows,
              { _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12), cells },
            ]);
          }}
          style={{
            padding: "6px 12px",
            border: "1px dashed var(--card-border-color)",
            borderRadius: 4,
            background: "transparent",
            color: "var(--card-muted-fg-color)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          + 行を追加
        </button>
      </div>
    </>
  );
}
