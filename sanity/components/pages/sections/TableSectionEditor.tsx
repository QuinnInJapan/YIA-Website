"use client";

import { useState } from "react";
import { TrashIcon } from "@sanity/icons";
import { BilingualInput } from "../../shared/BilingualInput";
import { i18nGet, i18nSet } from "../../shared/i18n";
import {
  emptyBilingual,
  padRowsForNewColumn,
  trimRowsForRemovedColumn,
  type I18nArr,
  type TableColumnDraft,
  type TableRowDraft,
} from "./table-utils";
import type { SectionItem } from "../types";

// ── Add/edit column form ─────────────────────────────────────────────

function ColumnForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: TableColumnDraft;
  onSave: (col: TableColumnDraft) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState<I18nArr>(initial?.label ?? emptyBilingual());

  return (
    <div
      style={{
        padding: "10px 12px",
        border: "1px solid var(--card-border-color)",
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <BilingualInput label="列見出し" value={label} onChange={setLabel} />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() =>
            onSave({
              _key: initial?._key ?? crypto.randomUUID().replace(/-/g, "").slice(0, 12),
              label,
            })
          }
          style={{
            padding: "5px 12px",
            border: "1px solid var(--card-border-color)",
            borderRadius: 4,
            background: "var(--card-bg-color)",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          追加
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "5px 12px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 12,
            color: "var(--card-muted-fg-color)",
          }}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

// ── Add/edit row form ────────────────────────────────────────────────

function RowForm({
  initial,
  columns,
  onSave,
  onCancel,
}: {
  initial?: TableRowDraft;
  columns: TableColumnDraft[];
  onSave: (row: TableRowDraft) => void;
  onCancel: () => void;
}) {
  const isInitiallyGroupHeader = !!initial?.groupLabel;
  const [isGroupHeader, setIsGroupHeader] = useState(isInitiallyGroupHeader);
  const [groupLabel, setGroupLabel] = useState<I18nArr>(initial?.groupLabel ?? emptyBilingual());
  const [cells, setCells] = useState<I18nArr[]>(
    initial?.cells ?? Array.from({ length: columns.length }, () => emptyBilingual()),
  );

  function toggleGroupHeader(checked: boolean) {
    setIsGroupHeader(checked);
    if (!checked) {
      // switching to data row: ensure cells array matches column count
      setCells((prev) => {
        const next = [...prev];
        while (next.length < columns.length) next.push(emptyBilingual());
        return next.slice(0, columns.length);
      });
    }
  }

  function handleSave() {
    const key = initial?._key ?? crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    if (isGroupHeader) {
      onSave({ _key: key, groupLabel, cells: [] });
    } else {
      onSave({ _key: key, groupLabel: null, cells });
    }
  }

  return (
    <div
      style={{
        padding: "10px 12px",
        border: "1px solid var(--card-border-color)",
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Group header toggle */}
      <label
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}
      >
        <input
          type="checkbox"
          checked={isGroupHeader}
          onChange={(e) => toggleGroupHeader(e.target.checked)}
        />
        グループ見出し行にする
      </label>

      {isGroupHeader ? (
        <BilingualInput label="見出し" value={groupLabel} onChange={setGroupLabel} />
      ) : (
        columns.map((col, colIndex) => {
          const colLabelJa = i18nGet(col.label, "ja") || `列 ${colIndex + 1}`;
          return (
            <BilingualInput
              key={col._key}
              label={colLabelJa}
              value={cells[colIndex] ?? emptyBilingual()}
              onChange={(val) => {
                setCells((prev) => {
                  const next = [...prev];
                  next[colIndex] = val as I18nArr;
                  return next;
                });
              }}
            />
          );
        })
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={handleSave}
          style={{
            padding: "5px 12px",
            border: "1px solid var(--card-border-color)",
            borderRadius: 4,
            background: "var(--card-bg-color)",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          追加
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "5px 12px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 12,
            color: "var(--card-muted-fg-color)",
          }}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

// ── Main editor ──────────────────────────────────────────────────────

export function TableSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  const columns = (section.columns as TableColumnDraft[]) ?? [];
  const rows = (section.rows as TableRowDraft[]) ?? [];

  const [addingColumn, setAddingColumn] = useState(false);
  const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(null);
  const [addingRow, setAddingRow] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  // Only data rows (not group headers) count for the deletion warning
  const dataRowCount = rows.filter((r) => !r.groupLabel).length;

  // ── Column operations ──────────────────────────────────────────────

  function saveColumn(col: TableColumnDraft) {
    if (editingColumnIndex !== null) {
      const updated = [...columns];
      updated[editingColumnIndex] = col;
      onUpdateField("columns", updated);
      setEditingColumnIndex(null);
    } else {
      onUpdateField("columns", [...columns, col]);
      onUpdateField("rows", padRowsForNewColumn(rows));
      setAddingColumn(false);
    }
  }

  function deleteColumn(colIndex: number) {
    const colLabelJa = i18nGet(columns[colIndex]?.label, "ja") || "この列";
    if (
      dataRowCount > 0 &&
      !window.confirm(
        `「${colLabelJa}」列を削除すると、全ての行からこの列のデータが削除されます。よろしいですか？`,
      )
    ) {
      return;
    }
    const updatedColumns = columns.filter((_, i) => i !== colIndex);
    const updatedRows = trimRowsForRemovedColumn(rows, colIndex);
    onUpdateField("columns", updatedColumns);
    onUpdateField("rows", updatedRows);
  }

  // ── Row operations ─────────────────────────────────────────────────

  function saveRow(row: TableRowDraft) {
    if (editingRowIndex !== null) {
      const updated = [...rows];
      updated[editingRowIndex] = row;
      onUpdateField("rows", updated);
      setEditingRowIndex(null);
    } else {
      onUpdateField("rows", [...rows, row]);
      setAddingRow(false);
    }
  }

  function deleteRow(rowIndex: number) {
    onUpdateField(
      "rows",
      rows.filter((_, i) => i !== rowIndex),
    );
    if (editingRowIndex === rowIndex) setEditingRowIndex(null);
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <>
      {/* Title */}
      <BilingualInput
        label="タイトル（任意）"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />

      {/* Caption */}
      <BilingualInput
        label="キャプション（任意）"
        value={section.caption as { _key: string; value: string }[] | null}
        onChange={(val) => onUpdateField("caption", val)}
      />

      {/* ── Columns section ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
          列定義
        </div>

        {columns.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
            {columns.map((col, colIndex) => {
              const labelJa = i18nGet(col.label, "ja") || "（ラベルなし）";
              const isEditing = editingColumnIndex === colIndex;

              return (
                <div key={col._key}>
                  {isEditing ? (
                    <ColumnForm
                      initial={col}
                      onSave={saveColumn}
                      onCancel={() => setEditingColumnIndex(null)}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 10px",
                        border: "1px solid var(--card-border-color)",
                        borderRadius: 4,
                      }}
                    >
                      <span
                        style={{ flex: 1, fontSize: 13, cursor: "pointer" }}
                        onClick={() => setEditingColumnIndex(colIndex)}
                      >
                        {labelJa}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteColumn(colIndex)}
                        title="列を削除"
                        style={{
                          padding: 4,
                          border: "none",
                          background: "transparent",
                          color: "var(--card-muted-fg-color)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {addingColumn ? (
          <ColumnForm onSave={saveColumn} onCancel={() => setAddingColumn(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setAddingColumn(true)}
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
            ＋ 列を追加
          </button>
        )}
      </div>

      {/* ── Rows section ── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>行</div>

        {columns.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", fontStyle: "italic" }}>
            先に列を定義してください
          </div>
        ) : (
          <>
            {rows.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                {rows.map((row, rowIndex) => {
                  const isEditing = editingRowIndex === rowIndex;
                  const isGroupHeader = !!row.groupLabel;
                  const labelJa = isGroupHeader
                    ? i18nGet(row.groupLabel, "ja") || "（見出しなし）"
                    : i18nGet(row.cells?.[0], "ja") || "（空の行）";

                  return (
                    <div key={row._key}>
                      {isEditing ? (
                        <RowForm
                          initial={row}
                          columns={columns}
                          onSave={saveRow}
                          onCancel={() => setEditingRowIndex(null)}
                        />
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 10px",
                            border: "1px solid var(--card-border-color)",
                            borderRadius: 4,
                            background: isGroupHeader
                              ? "var(--card-code-bg-color, rgba(0,0,0,0.03))"
                              : "transparent",
                          }}
                        >
                          {isGroupHeader && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: "var(--card-muted-fg-color)",
                                border: "1px solid var(--card-border-color)",
                                borderRadius: 3,
                                padding: "1px 4px",
                                flexShrink: 0,
                              }}
                            >
                              見出し
                            </span>
                          )}
                          <span
                            style={{
                              flex: 1,
                              fontSize: 13,
                              fontWeight: isGroupHeader ? 600 : 400,
                              cursor: "pointer",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            onClick={() => setEditingRowIndex(rowIndex)}
                          >
                            {labelJa}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteRow(rowIndex)}
                            title="行を削除"
                            style={{
                              padding: 4,
                              border: "none",
                              background: "transparent",
                              color: "var(--card-muted-fg-color)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {addingRow ? (
              <RowForm columns={columns} onSave={saveRow} onCancel={() => setAddingRow(false)} />
            ) : (
              <button
                type="button"
                onClick={() => setAddingRow(true)}
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
                ＋ 行を追加
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
