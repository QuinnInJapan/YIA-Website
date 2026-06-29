type I18nString = { _key: string; value: string }[];
type HyperlinkCell = {
  colKey?: string | null;
  href?: string | null;
};

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;

export interface DisplayCellContent {
  primary: string;
  secondary: string;
  isSingle: boolean;
}

export function getDisplayCellContent(cell: I18nString | undefined): DisplayCellContent {
  const primary = ja(cell);
  const secondary = en(cell);
  const visibleSecondary =
    secondary && comparableText(primary) !== comparableText(secondary) ? secondary : "";

  return {
    primary,
    secondary: visibleSecondary,
    isSingle: !visibleSecondary,
  };
}

export function getHyperlinkCellHref(
  cells: HyperlinkCell[] | null | undefined,
  colKey: string,
): string | undefined {
  const href = cells?.find((cell) => cell.colKey === colKey)?.href?.trim() ?? "";
  return SAFE_HREF.test(href) ? href : undefined;
}

function comparableText(value: string): string {
  return value
    .trim()
    .replace(/[〜～−–—]/g, "-")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function ja(field: I18nString | undefined): string {
  return field?.find((item) => item._key === "ja")?.value ?? "";
}

function en(field: I18nString | undefined): string {
  return field?.find((item) => item._key === "en")?.value ?? "";
}
