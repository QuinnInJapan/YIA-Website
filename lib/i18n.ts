import type { PortableTextBlock } from "@portabletext/types";

export type I18nString = { _key: string; value: string }[];
export type I18nBlocks = { _key: string; value: PortableTextBlock[] }[];

/** Extract a language value from an i18n array field. Returns "" for PT block fields. */
export function i18n(field: I18nString | I18nBlocks | undefined, lang: "ja" | "en"): string {
  if (!field) return "";
  const entry = field.find((f) => f._key === lang);
  if (!entry) return "";
  // If value is a string, return it; if it's PT blocks, return "" (use jaBlocks/enBlocks instead)
  return typeof entry.value === "string" ? entry.value : "";
}

export function ja(field: I18nString | I18nBlocks | undefined): string {
  return i18n(field, "ja");
}

export function en(field: I18nString | I18nBlocks | undefined): string {
  return i18n(field, "en");
}

/** Extract Portable Text blocks for a language from an i18n block content field */
export function jaBlocks(field: I18nBlocks | undefined): PortableTextBlock[] {
  return field?.find((f) => f._key === "ja")?.value ?? [];
}

export function enBlocks(field: I18nBlocks | undefined): PortableTextBlock[] {
  return field?.find((f) => f._key === "en")?.value ?? [];
}
