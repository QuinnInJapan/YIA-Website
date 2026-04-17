"use client";

import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { TextInput } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandleIcon } from "@sanity/icons";
import { FilePickerPanel } from "../../shared/FilePickerPanel";
import SectionTable from "@/components/SectionTable";
import { i18nGet, i18nSet } from "../../shared/i18n";
import {
  emptyBilingual,
  padRowsForNewColumn,
  trimRowsForRemovedColumn,
  type I18nArr,
  type TableColumnDraft,
  type TableColumnType,
  type TableRowDraft,
  type FileCellDraft,
} from "./table-utils";
import type { TableColumn, TableRow } from "@/lib/types";
import type { SectionItem } from "../types";

// ─── Shared styles ────────────────────────────────────────────────────────────

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 14,
  color: "var(--card-fg-color)",
  marginBottom: 6,
};

const subLabelStyle: React.CSSProperties = {
  fontSize: 14,
  color: "var(--card-fg-color)",
  marginBottom: 3,
};

const cellInputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "8px 6px",
  border: "none",
  background: "transparent",
  fontSize: 14,
  fontFamily: "inherit",
  color: "inherit",
  outline: "none",
  boxSizing: "border-box",
  resize: "none",
  overflow: "hidden",
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
  initialType,
  mode,
  onSave,
  onCancel,
}: {
  initialJa: string;
  initialEn: string;
  initialType: TableColumnType;
  mode: "add" | "edit";
  onSave: (ja: string, en: string, type: TableColumnType) => void;
  onCancel: () => void;
}) {
  const [ja, setJa] = useState(initialJa);
  const [en, setEn] = useState(initialEn);
  const [type, setType] = useState<TableColumnType>(initialType);

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
      {/* Type selector */}
      <div style={{ display: "flex", gap: 4 }}>
        {(["text", "file"] as TableColumnType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            style={{
              padding: "2px 10px",
              border: `1px solid ${type === t ? "var(--card-focus-ring-color, #5b9cf6)" : "var(--card-border-color)"}`,
              borderRadius: 3,
              background: type === t ? "var(--card-focus-ring-color, #5b9cf6)" : "transparent",
              color: type === t ? "#fff" : "var(--card-muted-fg-color)",
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            {t === "text" ? "テキスト" : "ファイル"}
          </button>
        ))}
      </div>

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
          onClick={() => onSave(ja.trim(), en.trim(), type)}
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

// ─── AutoTextarea ─────────────────────────────────────────────────────────────

function AutoTextarea({
  value,
  onChange,
  placeholder,
  style,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // No dep array — re-runs after every render so height always matches content,
  // including initial mount and external value changes.
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  });
  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      onChange={onChange}
      placeholder={placeholder}
      style={style}
    />
  );
}

// ─── SortableRow ──────────────────────────────────────────────────────────────

interface SortableRowProps {
  row: TableRowDraft;
  rowIndex: number;
  columns: TableColumnDraft[];
  onUpdateGroupLabel: (rowIndex: number, lang: "ja" | "en", value: string) => void;
  onUpdateCell: (rowIndex: number, colIndex: number, lang: "ja" | "en", value: string) => void;
  onDeleteRow: (index: number) => void;
  onPickFile: (state: { rowIndex: number; colKey: string }) => void;
  onClearFileCell: (rowIndex: number, colKey: string) => void;
}

function SortableRow({
  row,
  rowIndex,
  columns,
  onUpdateGroupLabel,
  onUpdateCell,
  onDeleteRow,
  onPickFile,
  onClearFileCell,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row._key,
  });
  const [focusedCol, setFocusedCol] = useState<string | null>(null);

  const rowStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleTd = (rowSpan: number) => (
    <td
      rowSpan={rowSpan}
      style={{
        border: "1px solid var(--card-border-color)",
        width: 24,
        padding: 0,
        textAlign: "center",
        verticalAlign: "middle",
        background: "var(--card-code-bg-color)",
      }}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        style={{
          padding: 3,
          border: "none",
          background: "transparent",
          color: "var(--card-muted-fg-color)",
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 0,
          touchAction: "none",
        }}
        title="ドラッグして並び替え"
      >
        <DragHandleIcon />
      </button>
    </td>
  );

  const deleteTd = (rowSpan: number) => (
    <td
      rowSpan={rowSpan}
      style={{
        border: "1px solid var(--card-border-color)",
        textAlign: "center",
        verticalAlign: "middle",
        width: 28,
      }}
    >
      <button
        type="button"
        onClick={() => onDeleteRow(rowIndex)}
        style={deleteButtonStyle}
        title="行を削除"
      >
        <TrashIcon />
      </button>
    </td>
  );

  if (row.groupLabel != null) {
    return (
      <tbody ref={setNodeRef} style={{ ...rowStyle, background: "rgba(200, 168, 75, 0.12)" }}>
        <tr>
          {handleTd(1)}
          <td
            colSpan={columns.length}
            style={{ border: "1px solid var(--card-border-color)", padding: 0 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 5px" }}>
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
                onChange={(e) => onUpdateGroupLabel(rowIndex, "ja", e.target.value)}
                placeholder="グループ名（日本語）"
                style={cellInputStyle}
              />
              <span style={{ color: "var(--card-muted-fg-color)", fontSize: 10, flexShrink: 0 }}>
                /
              </span>
              <input
                type="text"
                value={i18nGet(row.groupLabel, "en")}
                onChange={(e) => onUpdateGroupLabel(rowIndex, "en", e.target.value)}
                placeholder="Group name (English)"
                style={{ ...cellInputStyle, color: "var(--card-muted-fg-color)" }}
              />
            </div>
          </td>
          {deleteTd(1)}
        </tr>
      </tbody>
    );
  }

  // Data row: JA and EN in separate <tr> so the divider is a real table border —
  // always horizontally aligned regardless of cell content height.
  const fileCellTd = (col: TableColumnDraft) => {
    const fileCell = (row.fileCells ?? []).find((fc) => fc.colKey === col._key);
    return (
      <td
        key={col._key}
        rowSpan={2}
        onFocus={() => setFocusedCol(col._key)}
        onBlur={() => setFocusedCol(null)}
        style={{
          border: "1px solid var(--card-border-color)",
          padding: "8px 6px",
          verticalAlign: "middle",
          background: focusedCol === col._key ? "rgba(91, 156, 246, 0.07)" : undefined,
        }}
      >
        {fileCell?.assetRef ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                fontSize: 10,
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "var(--card-muted-fg-color)",
              }}
              title={fileCell.filename ?? undefined}
            >
              {fileCell.filename ?? fileCell.assetRef}
            </span>
            <button
              type="button"
              onClick={() => onPickFile({ rowIndex, colKey: col._key })}
              style={{
                padding: "2px 6px",
                border: "1px solid var(--card-border-color)",
                borderRadius: 3,
                background: "transparent",
                fontSize: 9,
                cursor: "pointer",
                flexShrink: 0,
                color: "var(--card-muted-fg-color)",
              }}
            >
              変更
            </button>
            <button
              type="button"
              onClick={() => onClearFileCell(rowIndex, col._key)}
              style={{
                padding: 2,
                border: "none",
                background: "transparent",
                color: "var(--card-muted-fg-color)",
                cursor: "pointer",
                lineHeight: 0,
              }}
            >
              <TrashIcon style={{ fontSize: 12 }} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onPickFile({ rowIndex, colKey: col._key })}
            style={{
              padding: "3px 8px",
              border: "1px dashed var(--card-border-color)",
              borderRadius: 3,
              background: "transparent",
              fontSize: 10,
              cursor: "pointer",
              color: "var(--card-muted-fg-color)",
              width: "100%",
            }}
          >
            ファイルを選択
          </button>
        )}
      </td>
    );
  };

  return (
    <tbody ref={setNodeRef} style={rowStyle}>
      {/* JA row */}
      <tr>
        {handleTd(2)}
        {columns.map((col, colIndex) => {
          if (col.type === "file") return fileCellTd(col);
          const cell = row.cells?.[colIndex] ?? emptyBilingual();
          return (
            <td
              key={col._key}
              onFocus={() => setFocusedCol(col._key)}
              onBlur={() => setFocusedCol(null)}
              style={{
                border: "1px solid var(--card-border-color)",
                padding: 0,
                verticalAlign: "top",
                background: focusedCol === col._key ? "rgba(91, 156, 246, 0.07)" : undefined,
              }}
            >
              <AutoTextarea
                value={i18nGet(cell, "ja")}
                onChange={(e) => onUpdateCell(rowIndex, colIndex, "ja", e.target.value)}
                placeholder="日本語"
                style={cellInputStyle}
              />
            </td>
          );
        })}
        {deleteTd(2)}
      </tr>
      {/* EN row — file columns are skipped (covered by rowSpan=2 above) */}
      <tr>
        {columns.map((col, colIndex) => {
          if (col.type === "file") return null;
          const cell = row.cells?.[colIndex] ?? emptyBilingual();
          return (
            <td
              key={col._key}
              onFocus={() => setFocusedCol(col._key)}
              onBlur={() => setFocusedCol(null)}
              style={{
                border: "1px solid var(--card-border-color)",
                padding: 0,
                verticalAlign: "top",
                background: focusedCol === col._key ? "rgba(91, 156, 246, 0.07)" : undefined,
              }}
            >
              <AutoTextarea
                value={i18nGet(cell, "en")}
                onChange={(e) => onUpdateCell(rowIndex, colIndex, "en", e.target.value)}
                placeholder="English"
                style={{ ...cellInputStyle, color: "var(--card-muted-fg-color)" }}
              />
            </td>
          );
        })}
      </tr>
    </tbody>
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

  const hasExistingColumns = !!(section.columns as TableColumnDraft[])?.length;

  const [columns, setColumns] = useState<TableColumnDraft[]>(() => {
    if (hasExistingColumns) return section.columns as TableColumnDraft[];
    return [
      {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        type: "text" as TableColumnType,
        label: [
          { _key: "ja", value: "項目" },
          { _key: "en", value: "Item" },
        ],
      },
    ];
  });

  const [rows, setRows] = useState<TableRowDraft[]>(() => {
    if (hasExistingColumns) return (section.rows as TableRowDraft[]) ?? [];
    return [
      {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        groupLabel: null,
        cells: [emptyBilingual()],
      },
    ];
  });

  // Persist defaults on mount when section had no columns yet
  const persistedDefaultRef = useRef(false);
  useEffect(() => {
    if (!hasExistingColumns && !persistedDefaultRef.current) {
      persistedDefaultRef.current = true;
      onUpdateField("columns", columns);
      onUpdateField("rows", rows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [colForm, setColForm] = useState<ColFormState>(null);
  const sensors = useSensors(useSensor(PointerSensor));
  const [filePicking, setFilePicking] = useState<{ rowIndex: number; colKey: string } | null>(null);

  // ── Column operations ──────────────────────────────────────

  function saveNewColumn(ja: string, en: string, type: TableColumnType) {
    const newCol: TableColumnDraft = {
      _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
      type,
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

  function saveEditColumn(index: number, ja: string, en: string, type: TableColumnType) {
    const nextCols = columns.map((col, i) =>
      i !== index
        ? col
        : {
            ...col,
            type,
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
    const col = columns[index];
    const hasData = rows.some(
      (row) =>
        !row.groupLabel &&
        ((col.type !== "file" && (row.cells?.[index] ?? []).some((c) => c.value !== "")) ||
          (col.type === "file" &&
            (row.fileCells ?? []).some((fc) => fc.colKey === col._key && fc.assetRef))),
    );
    if (!hasData) {
      const nextCols = columns.filter((_, i) => i !== index);
      const nextRows = trimRowsForRemovedColumn(rows, index, col._key);
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
    const col = columns[index];
    const nextCols = columns.filter((_, i) => i !== index);
    const nextRows = trimRowsForRemovedColumn(rows, index, col._key);
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

  // ── File cell operations ───────────────────────────────────

  function updateFileCell(
    rowIndex: number,
    colKey: string,
    assetRef: string,
    fileType: string,
    filename: string,
  ) {
    const nextRows = rows.map((row, ri) => {
      if (ri !== rowIndex) return row;
      const existing = row.fileCells ?? [];
      const filtered = existing.filter((fc) => fc.colKey !== colKey);
      const newCell: FileCellDraft = {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        colKey,
        assetRef,
        fileType,
        filename,
      };
      return { ...row, fileCells: [...filtered, newCell] };
    });
    setRows(nextRows);
    onUpdateField("rows", nextRows);
  }

  function clearFileCell(rowIndex: number, colKey: string) {
    const nextRows = rows.map((row, ri) => {
      if (ri !== rowIndex) return row;
      return { ...row, fileCells: (row.fileCells ?? []).filter((fc) => fc.colKey !== colKey) };
    });
    setRows(nextRows);
    onUpdateField("rows", nextRows);
  }

  // ── Drag-and-drop handler ──────────────────────────────────

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = rows.findIndex((r) => r._key === active.id);
      const newIndex = rows.findIndex((r) => r._key === over.id);
      const nextRows = arrayMove(rows, oldIndex, newIndex);
      setRows(nextRows);
      onUpdateField("rows", nextRows);
    }
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
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
          {/* ① Title */}
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
                        fontSize: 14,
                        fontWeight: 600,
                        color: isPendingDelete ? "#c03030" : "var(--card-fg-color)",
                      }}
                    >
                      {labelJa}
                    </span>
                    {labelEn && (
                      <span
                        style={{
                          fontSize: 12,
                          color: isPendingDelete ? "#e08080" : "var(--card-muted-fg-color)",
                        }}
                      >
                        {labelEn}
                      </span>
                    )}
                    {col.type === "file" && (
                      <span
                        style={{
                          fontSize: 8,
                          color: "#5b9cf6",
                          fontWeight: 700,
                          letterSpacing: 0,
                        }}
                      >
                        ファイル
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
                initialType="text"
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
                initialType={(columns[colForm.index]?.type as TableColumnType) ?? "text"}
                mode="edit"
                onSave={(ja, en, type) => saveEditColumn(colForm.index, ja, en, type)}
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 14,
                      tableLayout: "fixed",
                      minWidth: columns.length * 100 + 52,
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            width: 24,
                            border: "1px solid var(--card-border-color)",
                            background: "var(--card-code-bg-color)",
                          }}
                        />
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
                            {col.type === "file" && (
                              <span
                                style={{
                                  marginLeft: 4,
                                  fontSize: 8,
                                  color: "#5b9cf6",
                                  fontWeight: 700,
                                }}
                              >
                                F
                              </span>
                            )}
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
                    <SortableContext
                      items={rows.map((r) => r._key)}
                      strategy={verticalListSortingStrategy}
                    >
                      {rows.map((row, rowIndex) => (
                        <SortableRow
                          key={row._key}
                          row={row}
                          rowIndex={rowIndex}
                          columns={columns}
                          onUpdateGroupLabel={updateGroupLabel}
                          onUpdateCell={updateCell}
                          onDeleteRow={deleteRow}
                          onPickFile={setFilePicking}
                          onClearFileCell={clearFileCell}
                        />
                      ))}
                    </SortableContext>
                  </table>
                </DndContext>
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

          {/* ④ Live preview */}
          <div>
            <div style={sectionLabelStyle}>プレビュー</div>
            <div
              style={{
                border: "1px solid var(--card-border-color)",
                borderRadius: 4,
                overflow: "auto",
              }}
            >
              <TablePreview title={title} columns={columns} rows={rows} />
            </div>
          </div>
        </div>
      </div>

      {/* File picker overlay */}
      {filePicking !== null && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            background: "var(--card-bg-color)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <FilePickerPanel
            onSelect={(assetId, filename, ext) => {
              updateFileCell(filePicking.rowIndex, filePicking.colKey, assetId, ext, filename);
              setFilePicking(null);
            }}
            onClose={() => setFilePicking(null)}
          />
        </div>
      )}
    </div>
  );
}
