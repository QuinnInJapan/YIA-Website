import type { Announcement } from "@/lib/types";

export function selectHomepageAnnouncements({
  homepage,
  announcements,
  limit = 5,
}: {
  homepage?: { announcementRefs?: Announcement[] };
  announcements?: Announcement[];
  limit?: number;
}) {
  const curated = (homepage?.announcementRefs ?? []).filter((item) => item?._id);
  if (curated.length > 0) return curated.slice(0, limit);

  return [...(announcements ?? [])]
    .sort(
      (a, b) =>
        (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.date ?? "").localeCompare(a.date ?? ""),
    )
    .slice(0, limit);
}
