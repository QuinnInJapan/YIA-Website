import React from "react";
import { ja, en } from "@/lib/i18n";
import { fileUrl } from "@/lib/sanity/image";
import type { TableColumn, TableRow, FileCellItem } from "@/lib/types";

interface SectionTableProps {
  columns: TableColumn[];
  rows: TableRow[];
}

export default function SectionTable({ columns, rows }: SectionTableProps) {
  const colCount = columns.length;

  return (
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
              <td colSpan={colCount}>
                {ja(row.groupLabel)}
                {en(row.groupLabel) && (
                  <>
                    {" "}
                    <span className="data-table__en" lang="en" translate="no">
                      {en(row.groupLabel)}
                    </span>
                  </>
                )}
              </td>
            </tr>
          ) : (
            <tr key={row._key}>
              {columns.map((col, j) => {
                if (col.type === "file") {
                  const fileCell = row.fileCells?.find(
                    (fc: FileCellItem) => fc.colKey === col._key,
                  );
                  const url = fileCell?.assetRef
                    ? fileUrl({ asset: { _ref: fileCell.assetRef } })
                    : null;
                  return (
                    <td key={col._key} data-type="file">
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ wordBreak: "break-word" }}
                        >
                          {fileCell?.filename ?? "ファイルを開く"}
                        </a>
                      ) : null}
                    </td>
                  );
                }

                const cell = row.cells?.[j];
                return (
                  <td key={col._key} data-type={col.type ?? "text"}>
                    {cell ? (
                      <>
                        {ja(cell)}
                        {en(cell) && (
                          <>
                            <br />
                            <span className="data-table__en" lang="en" translate="no">
                              {en(cell)}
                            </span>
                          </>
                        )}
                      </>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ),
        )}
      </tbody>
    </table>
  );
}
