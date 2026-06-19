import React from "react";
import { ja, en } from "@/lib/i18n";
import { fileUrl } from "@/lib/sanity/image";
import { getDisplayCellContent } from "./table-cell-content";
import type { FileCellItem, TableColumn, TableRow } from "@/lib/types";

interface ComparisonTableProps {
  columns: TableColumn[];
  rows: TableRow[];
}

function labelFor(col: TableColumn) {
  const labelJa = ja(col.label);
  const labelEn = en(col.label);
  return labelEn ? `${labelJa} / ${labelEn}` : labelJa;
}

function FileCell({ row, col }: { row: TableRow; col: TableColumn }) {
  const fileCell = row.fileCells?.find((fc: FileCellItem) => fc.colKey === col._key);
  const url = fileCell?.assetRef ? fileUrl({ asset: { _ref: fileCell.assetRef } }) : null;
  if (!url) return null;

  return (
    <a className="comparison-table__file" href={url} target="_blank" rel="noopener noreferrer">
      {fileCell?.filename ?? labelFor(col)}
    </a>
  );
}

export default function ComparisonTable({ columns, rows }: ComparisonTableProps) {
  return (
    <div className="comparison-table">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col._key} scope="col" data-type={col.type ?? "text"}>
                {ja(col.label)}
                {en(col.label) && (
                  <span lang="en" translate="no">
                    {en(col.label)}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            if (row.groupLabel) {
              return (
                <tr key={row._key} className="comparison-table__group">
                  <th colSpan={columns.length} scope="colgroup">
                    {ja(row.groupLabel)}
                    {en(row.groupLabel) && (
                      <span lang="en" translate="no">
                        {en(row.groupLabel)}
                      </span>
                    )}
                  </th>
                </tr>
              );
            }

            return (
              <tr key={row._key}>
                {columns.map((col, colIndex) => {
                  if (col.type === "file") {
                    return (
                      <td key={col._key} data-label={labelFor(col)} data-type="file">
                        <FileCell row={row} col={col} />
                      </td>
                    );
                  }

                  const cell = getDisplayCellContent(row.cells?.[colIndex]);
                  const isNameColumn = colIndex === 0;
                  const CellTag = isNameColumn ? "th" : "td";

                  return (
                    <CellTag
                      key={col._key}
                      data-label={labelFor(col)}
                      scope={isNameColumn ? "row" : undefined}
                    >
                      {cell.primary}
                      {cell.secondary && (
                        <span lang="en" translate="no">
                          {cell.secondary}
                        </span>
                      )}
                    </CellTag>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
