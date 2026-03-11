import React from "react";
import type { BilingualCell } from "@/lib/types";

interface DataTableProps {
  columns: string[];
  columnsEn?: string[];
  rows: (string[] | { ja: string; en: string }[])[];
}

export default function DataTable({
  columns,
  columnsEn,
  rows,
}: DataTableProps) {
  const headers = columns.map((c, i) => (
    <th key={i} scope="col">
      {c}
      {columnsEn?.[i] ? ` ${columnsEn[i]}` : ""}
    </th>
  ));

  const bodyRows = (rows as (string[] | BilingualCell[])[]).map((r, i) => {
    const cells = Array.isArray(r)
      ? r
      : Object.entries(r)
          .filter(([k]) => !k.startsWith("_"))
          .map(([, v]) => v);
    return (
      <tr key={i}>
        {cells.map((v, j) => {
          if (typeof v === "object" && v !== null && "ja" in v && "en" in v) {
            const cell = v as BilingualCell;
            return (
              <td key={j}>
                {cell.ja}
                {cell.en && (
                  <>
                    <br />
                    <span className="data-table__en" lang="en" translate="no">{cell.en}</span>
                  </>
                )}
              </td>
            );
          }
          return <td key={j}>{String(v)}</td>;
        })}
      </tr>
    );
  });

  return (
    <table className="data-table">
      <thead>
        <tr>{headers}</tr>
      </thead>
      <tbody>{bodyRows}</tbody>
    </table>
  );
}
