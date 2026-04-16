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
        columns={columns.filter((c) => c.label != null) as unknown as TableColumn[]}
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
      type: "text",
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
                      <TrashIcon style={{ fontSize: 10 }} />
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
