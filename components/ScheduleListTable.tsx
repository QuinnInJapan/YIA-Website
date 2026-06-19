import React from "react";
import { ja, en } from "@/lib/i18n";
import { fileUrl } from "@/lib/sanity/image";
import { getDisplayCellContent } from "./table-cell-content";
import type { FileCellItem, TableColumn, TableRow } from "@/lib/types";

interface ScheduleListTableProps {
  columns: TableColumn[];
  rows: TableRow[];
}

function columnLabel(col: TableColumn) {
  const labelJa = ja(col.label);
  const labelEn = en(col.label);
  return labelEn ? `${labelJa} / ${labelEn}` : labelJa;
}

function FileLinks({ row, columns }: { row: TableRow; columns: TableColumn[] }) {
  const links = columns
    .filter((col) => col.type === "file")
    .map((col) => {
      const fileCell = row.fileCells?.find((fc: FileCellItem) => fc.colKey === col._key);
      const url = fileCell?.assetRef ? fileUrl({ asset: { _ref: fileCell.assetRef } }) : null;
      if (!url) return null;
      return {
        key: fileCell?._key ?? col._key,
        label: fileCell?.filename ?? columnLabel(col),
        url,
      };
    })
    .filter((link): link is { key: string; label: string; url: string } => Boolean(link));

  if (!links.length) return null;

  return (
    <div className="schedule-list__links">
      {links.map((link) => (
        <a key={link.key} href={link.url} target="_blank" rel="noopener noreferrer">
          {link.label}
        </a>
      ))}
    </div>
  );
}

export default function ScheduleListTable({ columns, rows }: ScheduleListTableProps) {
  const textColumns = columns.filter((col) => col.type !== "file");
  const groupColumn = textColumns[0];
  const detailColumns = textColumns.slice(1);

  return (
    <div className="schedule-list">
      {rows.map((row) => {
        if (row.groupLabel) {
          return (
            <h3 key={row._key} className="schedule-list__group">
              {ja(row.groupLabel)}
              {en(row.groupLabel) && (
                <span lang="en" translate="no">
                  {en(row.groupLabel)}
                </span>
              )}
            </h3>
          );
        }

        const groupCell = getDisplayCellContent(row.cells?.[0]);
        const details = detailColumns.map((col, detailIndex) => {
          const cell = getDisplayCellContent(row.cells?.[detailIndex + 1]);
          return { col, cell };
        });

        return (
          <article key={row._key} className="schedule-list__entry">
            <div className="schedule-list__main">
              <div className="schedule-list__name">
                {groupCell.primary || ja(groupColumn?.label)}
                {groupCell.secondary && (
                  <span lang="en" translate="no">
                    {groupCell.secondary}
                  </span>
                )}
              </div>
              <dl className="schedule-list__details">
                {details.map(({ col, cell }) => (
                  <div key={col._key} className="schedule-list__detail">
                    <dt>{columnLabel(col)}</dt>
                    <dd>
                      {cell.primary}
                      {cell.secondary && (
                        <span lang="en" translate="no">
                          {cell.secondary}
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <FileLinks row={row} columns={columns} />
          </article>
        );
      })}
    </div>
  );
}
