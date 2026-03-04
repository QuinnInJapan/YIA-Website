/**
 * Date formatting utilities for converting ISO date strings (YYYY-MM-DD)
 * to locale-appropriate display formats.
 *
 * All functions gracefully handle non-ISO input (e.g. already-formatted
 * Japanese dates from Sanity) by returning the original string.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "2025-07-06" → "2025年7月6日（日）" */
export function formatDateJa(dateStr: string): string {
  if (!ISO_DATE_RE.test(dateStr)) return dateStr;
  const date = new Date(dateStr + "T00:00:00");
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(date);
  return `${year}年${month}月${day}日（${dayOfWeek}）`;
}

/** "2025-07-06" → "July 6, 2025 (Sunday)" */
export function formatDateEn(dateStr: string): string {
  if (!ISO_DATE_RE.test(dateStr)) return dateStr;
  const date = new Date(dateStr + "T00:00:00");
  const formatted = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  const dayOfWeek = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  return `${formatted} (${dayOfWeek})`;
}

/** "2025-07-06" → "2025.07.06" */
export function formatDateDot(dateStr: string): string {
  return dateStr.replace(/-/g, ".");
}
