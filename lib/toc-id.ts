/** Generate a stable, document-unique section id for one heading occurrence. */
export function tocId(text: string, occurrence = 0): string {
  const base = `sec-${text.replace(/\s+/g, "-")}`;
  return occurrence === 0 ? base : `${base}--${occurrence + 1}`;
}
