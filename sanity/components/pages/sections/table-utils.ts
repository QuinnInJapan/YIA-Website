// sanity/components/pages/sections/table-utils.ts

export type I18nArr = { _key: string; value: string }[];

export interface TableColumnDraft {
  _key: string;
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

/** When toggling a row from data → group header: clear cells, initialise groupLabel. */
export function convertToGroupHeader(row: TableRowDraft): TableRowDraft {
  return { _key: row._key, groupLabel: emptyBilingual(), cells: [] };
}

/** When toggling a row from group header → data: clear groupLabel, pad cells to match column count. */
export function convertToDataRow(row: TableRowDraft, columnCount: number): TableRowDraft {
  const cells = Array.from({ length: columnCount }, () => emptyBilingual());
  return { _key: row._key, groupLabel: null, cells };
}
