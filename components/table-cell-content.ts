type I18nString = { _key: string; value: string }[];

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
