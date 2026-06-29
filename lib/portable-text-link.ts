const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export function safePortableTextHref(value: unknown): string | undefined {
  const href = typeof value === "string" ? value.trim() : "";
  if (!href) return undefined;
  return SAFE_HREF.test(href) ? href : undefined;
}

export function normalizePortableTextHrefInput(value: string): string | undefined {
  const href = value.trim();
  if (!href) return undefined;
  if (safePortableTextHref(href)) return href;
  if (HAS_SCHEME.test(href)) return undefined;
  return `https://${href}`;
}
