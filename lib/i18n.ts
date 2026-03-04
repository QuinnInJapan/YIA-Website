export type I18nString = { _key: string; value: string }[];

/** Extract a language value from an i18n array field */
export function i18n(field: I18nString | undefined, lang: "ja" | "en" | "easy"): string {
  return field?.find((f) => f._key === lang)?.value ?? "";
}

export function ja(field: I18nString | undefined): string {
  return i18n(field, "ja");
}

export function en(field: I18nString | undefined): string {
  return i18n(field, "en");
}

export function easy(field: I18nString | undefined): string {
  return i18n(field, "easy");
}
