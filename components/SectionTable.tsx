import React from "react";
import { ja, en } from "@/lib/i18n";
import { fileUrl } from "@/lib/sanity/image";
import {
  getDisplayCellContent,
  getHyperlinkCellHref,
  type DisplayCellContent,
} from "./table-cell-content";
import type { TableColumn, TableRow, FileCellItem } from "@/lib/types";

interface SectionTableProps {
  columns: TableColumn[];
  rows: TableRow[];
}

function externalLinkProps(href: string) {
  return /^https?:\/\//i.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

function columnLabel(column: TableColumn) {
  const labelJa = ja(column.label);
  const labelEn = en(column.label);
  return labelEn ? `${labelJa} / ${labelEn}` : labelJa;
}

function CellText({ cell }: { cell: DisplayCellContent }) {
  return (
    <>
      <span className="data-table__primary">{cell.primary}</span>
      {cell.secondary && (
        <>
          <br />
          <span className="data-table__en" lang="en" translate="no">
            {cell.secondary}
          </span>
        </>
      )}
    </>
  );
}

export default function SectionTable({ columns, rows }: SectionTableProps) {
  const colCount = columns.length;

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col._key} scope="col" data-type={col.type ?? "text"}>
                {ja(col.label)}
                {en(col.label) && (
                  <>
                    <br />
                    <span className="data-table__en" lang="en" translate="no">
                      {en(col.label)}
                    </span>
                  </>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) =>
            row.groupLabel ? (
              <tr key={row._key} className="data-table__group-header">
                <th colSpan={colCount} scope="rowgroup">
                  {ja(row.groupLabel)}
                  {en(row.groupLabel) && (
                    <>
                      {" "}
                      <span className="data-table__en" lang="en" translate="no">
                        {en(row.groupLabel)}
                      </span>
                    </>
                  )}
                </th>
              </tr>
            ) : (
              <tr key={row._key}>
                {columns.map((col, j) => {
                  const isRowHeader = j === 0;
                  const CellTag = isRowHeader ? "th" : "td";
                  const label = columnLabel(col);

                  if (col.type === "file") {
                    const fileCell = row.fileCells?.find(
                      (fc: FileCellItem) => fc.colKey === col._key,
                    );
                    const url = fileCell?.assetRef
                      ? fileUrl({ asset: { _ref: fileCell.assetRef } })
                      : null;
                    return (
                      <CellTag
                        key={col._key}
                        data-label={label}
                        data-type="file"
                        scope={isRowHeader ? "row" : undefined}
                      >
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            {fileCell?.filename ?? "ファイルを開く"}
                          </a>
                        ) : null}
                      </CellTag>
                    );
                  }

                  const cell = getDisplayCellContent(row.cells?.[j]);
                  const href =
                    col.type === "hyperlink"
                      ? getHyperlinkCellHref(row.hyperlinkCells, col._key)
                      : undefined;
                  return (
                    <CellTag
                      className={cell.isSingle ? "data-table__cell--single" : undefined}
                      key={col._key}
                      data-label={label}
                      data-type={col.type ?? "text"}
                      scope={isRowHeader ? "row" : undefined}
                    >
                      {cell.primary && href ? (
                        <a className="data-table__link" href={href} {...externalLinkProps(href)}>
                          <CellText cell={cell} />
                        </a>
                      ) : cell.primary ? (
                        <CellText cell={cell} />
                      ) : null}
                    </CellTag>
                  );
                })}
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
