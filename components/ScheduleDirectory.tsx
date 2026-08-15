import React from "react";
import { en, ja } from "@/lib/i18n";
import { fileUrl } from "@/lib/sanity/image";
import { getDisplayCellContent, type DisplayCellContent } from "./table-cell-content";
import type { FileCellItem, TableColumn, TableRow } from "@/lib/types";

interface ScheduleDirectoryProps {
  columns: TableColumn[];
  rows: TableRow[];
}

type ColumnRole =
  | "name"
  | "day"
  | "time"
  | "floor"
  | "location"
  | "fee"
  | "learner"
  | "remarks"
  | "detail"
  | "file";

interface MappedColumn {
  col: TableColumn;
  index: number;
  role: ColumnRole;
}

const ROLE_ORDER: ColumnRole[] = ["floor", "location", "fee", "learner", "remarks", "detail"];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\s/_-]+/g, "")
    .replace(/[（）()]/g, "");
}

function labelFor(col: TableColumn): string {
  const labelJa = ja(col.label);
  const labelEn = en(col.label);
  return labelEn ? `${labelJa} / ${labelEn}` : labelJa;
}

function labelOr(column: MappedColumn | undefined, fallback: string): string {
  return column ? labelFor(column.col) : fallback;
}

function shortLabelFor(col: TableColumn): string {
  const labelEn = en(col.label);
  const labelJa = ja(col.label);
  return labelEn || labelJa || "File";
}

function roleFor(col: TableColumn, index: number): ColumnRole {
  if (col.type === "file") return "file";

  const key = normalize(col._key);
  const label = normalize(`${ja(col.label)} ${en(col.label)}`);
  const source = `${key} ${label}`;

  if (/(group|name|class|title|グループ|クラス|名前)/.test(source)) return "name";
  if (/(day|曜日)/.test(source)) return "day";
  if (/(time|時間)/.test(source)) return "time";
  if (/(floor|階)/.test(source)) return "floor";
  if (/(location|place|venue|場所|会場)/.test(source)) return "location";
  if (/(fee|cost|price|参加費|費用|料金)/.test(source)) return "fee";
  if (/(learner|audience|target|対象|受講者)/.test(source)) return "learner";
  if (/(remark|note|備考|注意)/.test(source)) return "remarks";
  return index === 0 ? "name" : "detail";
}

function mapColumns(columns: TableColumn[]): MappedColumn[] {
  let hasName = false;
  return columns.map((col, index) => {
    let role = roleFor(col, index);
    if (role === "name") {
      if (hasName) role = "detail";
      hasName = true;
    }
    return { col, index, role };
  });
}

function CellText({ cell }: { cell: DisplayCellContent }) {
  return (
    <>
      {cell.primary}
      {cell.secondary && (
        <span lang="en" translate="no">
          {cell.secondary}
        </span>
      )}
    </>
  );
}

function valueFor(row: TableRow, column: MappedColumn): DisplayCellContent {
  return getDisplayCellContent(row.cells?.[column.index]);
}

function fileNameFromUrl(url: string): string {
  const path = url.split("?")[0] ?? "";
  return decodeURIComponent(path.substring(path.lastIndexOf("/") + 1));
}

function FileActions({ row, columns }: { row: TableRow; columns: MappedColumn[] }) {
  const links = columns
    .filter((column) => column.role === "file")
    .map((column) => {
      const fileCell = row.fileCells?.find((fc: FileCellItem) => fc.colKey === column.col._key);
      const url = fileCell?.assetRef ? fileUrl({ asset: { _ref: fileCell.assetRef } }) : null;
      if (!url) return null;
      const filename = fileCell?.filename || fileNameFromUrl(url) || shortLabelFor(column.col);
      return {
        key: fileCell?._key ?? column.col._key,
        label: shortLabelFor(column.col),
        filename,
        url,
      };
    })
    .filter((link): link is { key: string; label: string; filename: string; url: string } =>
      Boolean(link),
    );

  if (!links.length) return null;

  return (
    <>
      {links.map((link) => (
        <a
          key={link.key}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title={link.filename}
          aria-label={`${link.label}: ${link.filename}`}
        >
          {link.label}
        </a>
      ))}
    </>
  );
}

function Detail({ row, column }: { row: TableRow; column: MappedColumn }) {
  const cell = valueFor(row, column);
  if (!cell.primary && !cell.secondary) return null;

  return (
    <div className={`schedule-directory__detail schedule-directory__detail--${column.role}`}>
      <span className="schedule-directory__detail-label">{labelFor(column.col)}</span>
      <span className="schedule-directory__detail-value">
        <CellText cell={cell} />
      </span>
    </div>
  );
}

export default function ScheduleDirectory({ columns, rows }: ScheduleDirectoryProps) {
  const mappedColumns = mapColumns(columns);
  const nameColumn = mappedColumns.find((column) => column.role === "name");
  const dayColumn = mappedColumns.find((column) => column.role === "day");
  const timeColumn = mappedColumns.find((column) => column.role === "time");
  const detailColumns = mappedColumns
    .filter((column) => ROLE_ORDER.includes(column.role))
    .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
  const fileColumn = mappedColumns.find((column) => column.role === "file");
  const dayLabel = labelOr(dayColumn, "曜日 / Day");
  const timeLabel = labelOr(timeColumn, "時間 / Time");
  const nameLabel = labelOr(nameColumn, "項目 / Item");
  const detailsLabel = "詳細 / Details";
  const filesLabel = labelOr(fileColumn, "ファイル / Files");

  return (
    <div className="schedule-directory">
      <div className="schedule-directory__grid" role="list">
        <div className="schedule-directory__head" aria-hidden="true">
          <div>{dayLabel}</div>
          <div>{timeLabel}</div>
          <div>{nameLabel}</div>
          <div>{detailsLabel}</div>
          <div>{filesLabel}</div>
        </div>
        {rows.map((row) => {
          if (row.groupLabel) {
            return (
              <div key={row._key} className="schedule-directory__group" role="listitem">
                {ja(row.groupLabel)}
                {en(row.groupLabel) && (
                  <span lang="en" translate="no">
                    {en(row.groupLabel)}
                  </span>
                )}
              </div>
            );
          }

          const nameCell = nameColumn
            ? valueFor(row, nameColumn)
            : getDisplayCellContent(row.cells?.[0]);
          const dayCell = dayColumn ? valueFor(row, dayColumn) : getDisplayCellContent(undefined);
          const timeCell = timeColumn
            ? valueFor(row, timeColumn)
            : getDisplayCellContent(undefined);

          return (
            <article key={row._key} className="schedule-directory__entry" role="listitem">
              <div className="schedule-directory__day" data-label={dayLabel}>
                <CellText cell={dayCell} />
              </div>
              <div className="schedule-directory__time" data-label={timeLabel}>
                <CellText cell={timeCell} />
              </div>
              <div className="schedule-directory__name">
                <CellText cell={nameCell} />
              </div>
              <div className="schedule-directory__details" data-label={detailsLabel}>
                {detailColumns.map((column) => (
                  <Detail key={column.col._key} row={row} column={column} />
                ))}
              </div>
              <div className="schedule-directory__actions" data-label={filesLabel}>
                {fileColumn ? <FileActions row={row} columns={mappedColumns} /> : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
