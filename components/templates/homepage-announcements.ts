import type { Announcement } from "@/lib/types";

export function announcementPath(
  announcement: Pick<Announcement, "_id"> & {
    slug?: unknown;
    destinationType?: unknown;
    targetPageData?: Announcement["targetPageData"];
    targetAnchor?: unknown;
  },
) {
  if (announcement.destinationType === "internalPage") {
    const targetPath = internalPagePath(announcement.targetPageData);
    if (targetPath) {
      const anchor = anchorValue(announcement.targetAnchor);
      return anchor ? `${targetPath}#${anchor}` : targetPath;
    }
  }

  const slug = slugSegment(announcement.slug);
  return `/announcements/${slug || announcement._id}`;
}

function anchorValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const anchor = value.trim().replace(/^#/, "");
  return anchor && !anchor.includes("#") ? anchor : undefined;
}

export function selectHomepageAnnouncements({
  announcements,
  limit = 5,
}: {
  homepage?: { announcementRefs?: Announcement[] };
  announcements?: Announcement[];
  limit?: number;
}) {
  return [...(announcements ?? [])]
    .sort(
      (a, b) =>
        (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.date ?? "").localeCompare(a.date ?? ""),
    )
    .slice(0, limit);
}

function internalPagePath(target: Announcement["targetPageData"]): string | undefined {
  const category = documentSegment(target?.categoryId);
  const slug = slugSegment(target?.slug);
  if (!category || !slug) return undefined;
  return `/${category}/${slug}`;
}

function documentSegment(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value
    .trim()
    .replace(/^drafts\./, "")
    .replace(/^category-/, "");
  if (!clean || clean.includes("/") || clean.includes("..") || clean.includes(":"))
    return undefined;
  return clean;
}

function slugSegment(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && "current" in value) {
    const current = (value as { current?: unknown }).current;
    if (typeof current === "string" && current.trim()) return current.trim();
  }
  return undefined;
}
