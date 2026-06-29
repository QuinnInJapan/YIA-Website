import type { Announcement } from "@/lib/types";

export function announcementPath(announcement: Pick<Announcement, "_id"> & { slug?: unknown }) {
  const slug = slugSegment(announcement.slug);
  return `/announcements/${slug || announcement._id}`;
}

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

function slugSegment(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && "current" in value) {
    const current = (value as { current?: unknown }).current;
    if (typeof current === "string" && current.trim()) return current.trim();
  }
  return undefined;
}
