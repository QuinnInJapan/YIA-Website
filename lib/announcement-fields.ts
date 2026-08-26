export const ANNOUNCEMENT_DESTINATION_DETAIL = "detail";
export const ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE = "internalPage";

export type AnnouncementDestination =
  | typeof ANNOUNCEMENT_DESTINATION_DETAIL
  | typeof ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE;

export function announcementDestination(value: unknown): AnnouncementDestination {
  return value === ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE
    ? ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE
    : ANNOUNCEMENT_DESTINATION_DETAIL;
}

export function announcementSlugError(value: unknown): string | null {
  const slug = slugValue(value);

  if (!slug) {
    return "URLの末尾を入力してください。例：summer-event";
  }

  if (/^https?:\/\//i.test(slug) || slug.includes("/")) {
    return "URL全体ではなく、/announcements/ の後に入る文字だけを入力してください。例：summer-event";
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "半角小文字の英数字とハイフンだけを使用してください。例：summer-event";
  }

  return null;
}

function slugValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "current" in value) {
    const current = (value as { current?: unknown }).current;
    return typeof current === "string" ? current.trim() : "";
  }
  return "";
}
