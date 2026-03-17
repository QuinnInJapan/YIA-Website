import type { PortableTextBlock } from "@portabletext/editor";

export function i18nGet(
  arr: { _key: string; value: string }[] | null | undefined,
  lang: string,
): string {
  return arr?.find((item) => item._key === lang)?.value ?? "";
}

export function i18nSet(
  arr: { _key: string; value: string }[] | null | undefined,
  lang: string,
  value: string,
): { _key: string; value: string }[] {
  const existing = arr ?? [];
  const idx = existing.findIndex((item) => item._key === lang);
  if (idx >= 0) {
    return existing.map((item, i) => (i === idx ? { ...item, value } : item));
  }
  return [...existing, { _key: lang, value }];
}

export function i18nGetBody(
  arr: { _key: string; value: PortableTextBlock[] }[] | null | undefined,
  lang: string,
): PortableTextBlock[] {
  return arr?.find((item) => item._key === lang)?.value ?? [];
}

export function i18nSetBody(
  arr: { _key: string; value: PortableTextBlock[] }[] | null | undefined,
  lang: string,
  value: PortableTextBlock[],
): { _key: string; value: PortableTextBlock[] }[] {
  const existing = arr ?? [];
  const idx = existing.findIndex((item) => item._key === lang);
  if (idx >= 0) {
    return existing.map((item, i) => (i === idx ? { ...item, value } : item));
  }
  return [...existing, { _key: lang, value }];
}
