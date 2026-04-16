// sanity/components/pages/sections/table-utils.ts

export type I18nArr = { _key: string; value: string }[];

export type TableColumnType = "text" | "date" | "phone" | "url" | "currency" | "name";

export interface TableColumnDraft {
  _key: string;
  type?: TableColumnType;
  label?: I18nArr | null;
}

export interface TableRowDraft {
  _key: string;
  groupLabel?: I18nArr | null;
  cells?: I18nArr[] | null;
}

export function emptyBilingual(): I18nArr {
  return [
    { _key: "ja", value: "" },
    { _key: "en", value: "" },
  ];
}

/** When a column is added, append an empty bilingual cell to every data row. */
export function padRowsForNewColumn(rows: TableRowDraft[]): TableRowDraft[] {
  return rows.map((row) => {
    if (row.groupLabel) return row; // group header rows don't have cells
    return { ...row, cells: [...(row.cells ?? []), emptyBilingual()] };
  });
}

/** When column at colIndex is removed, trim that positional cell from every data row. */
export function trimRowsForRemovedColumn(rows: TableRowDraft[], colIndex: number): TableRowDraft[] {
  return rows.map((row) => {
    if (row.groupLabel) return row;
    const cells = [...(row.cells ?? [])];
    cells.splice(colIndex, 1);
    return { ...row, cells };
  });
}
