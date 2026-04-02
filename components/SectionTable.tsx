import React from "react";
import { ja, en } from "@/lib/i18n";
import type { TableColumn, TableRow } from "@/lib/types";

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
