// sanity/components/pages/sections/table-utils.ts

export type I18nArr = { _key: string; value: string }[];

export type TableColumnType = "text" | "file";

export interface TableColumnDraft {
  _key: string;
  type?: TableColumnType;
  label?: I18nArr | null;
}

export interface FileCellDraft {
  _key: string;
  colKey: string;
  assetRef?: string | null;
  fileType?: string | null;
  filename?: string | null;
}

export interface TableRowDraft {
  _key: string;
  groupLabel?: I18nArr | null;
  cells?: I18nArr[] | null;
  fileCells?: FileCellDraft[];
}

export function emptyBilingual(): I18nArr {
  return [
    { _key: "ja", value: "" },
    { _key: "en", value: "" },
  ];
}

/**
 * When a column is added, append an empty bilingual cell to every data row.
 * We always append a placeholder so positional alignment of `cells` stays correct
 * even when some columns are file-type (file data lives in `fileCells` separately).
 */
export function padRowsForNewColumn(rows: TableRowDraft[]): TableRowDraft[] {
  return rows.map((row) => {
    if (row.groupLabel != null) return row; // group header rows don't have cells
    return { ...row, cells: [...(row.cells ?? []), emptyBilingual()] };
  });
}

/**
 * When column at colIndex is removed:
 * - Trim the positional cell from `cells`
 * - Remove the matching entry from `fileCells` (by colKey)
 */
export function trimRowsForRemovedColumn(
  rows: TableRowDraft[],
  colIndex: number,
  colKey: string,
): TableRowDraft[] {
  return rows.map((row) => {
    if (row.groupLabel != null) return row;
    const cells = [...(row.cells ?? [])];
    cells.splice(colIndex, 1);
    const fileCells = (row.fileCells ?? []).filter((fc) => fc.colKey !== colKey);
    return { ...row, cells, fileCells };
  });
}
