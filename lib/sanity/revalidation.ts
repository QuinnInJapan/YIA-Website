export const SANITY_SITE_DATA_TAG = "sanity:site-data";

// The shared tag is an emergency/manual purge only. Publishing expires specific
// dependencies so an ordinary body edit cannot invalidate unrelated routes.
export const sanityFetchOptions = (...tags: string[]) => ({
  next: { revalidate: false as const, tags: [...new Set([SANITY_SITE_DATA_TAG, ...tags])] },
});

export type RevalidationTarget = {
  path: string;
  type: "page" | "layout";
};

type UnknownRecord = Record<string, unknown>;

export const sanityTags = {
  settings: "sanity:settings",
  sidebar: "sanity:sidebar",
  categories: "sanity:categories",
  navigation: "sanity:navigation",
  navigationRoutes: "sanity:navigation-routes",
  homepage: "sanity:homepage",
  homepageAbout: "sanity:homepage-about",
  featured: "sanity:featured",
  social: "sanity:social",
  pages: "sanity:pages",
  pageSummaries: "sanity:page-summaries",
  pageRoutes: "sanity:page-routes",
  blogList: "sanity:blog-list",
  blogDocuments: "sanity:blog-documents",
  blogRelated: "sanity:blog-related",
  blogAdjacent: "sanity:blog-adjacent",
  blogCount: "sanity:blog-count",
  blogRoutes: "sanity:blog-routes",
  announcements: "sanity:announcements",
  announcementDocuments: "sanity:announcement-documents",
  announcementCount: "sanity:announcement-count",
  announcementTargets: "sanity:announcement-targets",
} as const;

export function sanityDocumentTag(
  kind: "page" | "page-summary" | "blog" | "announcement",
  key: string,
) {
  // Next tags have a 256-character limit. Collisions only over-invalidate.
  return `sanity:${kind}:${encodeURIComponent(key).slice(0, 180)}`;
}

export interface RevalidationPlan {
  tags: string[];
  paths: RevalidationTarget[];
}

export function resolveSanityRevalidationPlan(payload: unknown): RevalidationPlan {
  const record = isRecord(payload) ? payload : {};
  const paths = explicitPathTargets(unwrapDocument(payload));
  // Preserve authenticated maintenance scripts' existing explicit purge contract.
  if (paths.length) return { tags: [SANITY_SITE_DATA_TAG], paths };

  const versioned =
    record.schemaVersion === 1 &&
    Object.hasOwn(record, "before") &&
    Object.hasOwn(record, "after") &&
    (record.before === null || isRecord(record.before)) &&
    (record.after === null || isRecord(record.after));
  const before = versioned && isRecord(record.before) ? record.before : null;
  const after = versioned
    ? isRecord(record.after)
      ? record.after
      : null
    : unwrapDocument(payload);
  const documents = [before, after].filter((doc): doc is UnknownRecord => !!doc);
  if (
    !documents.length ||
    documents.some((doc) => /^(drafts|versions)\./.test(String(doc._id ?? "")))
  ) {
    return { tags: [], paths: [] };
  }
  const tags = new Set<string>();
  const add = (...values: string[]) => values.forEach((value) => tags.add(value));
  const lifecycle = !versioned || !before || !after;
  const changed = (...fields: string[]) =>
    lifecycle ||
    fields.some(
      (field) =>
        JSON.stringify(canonical(fieldValue(before, field))) !==
        JSON.stringify(canonical(fieldValue(after, field))),
    );
  const keys = (kind: Parameters<typeof sanityDocumentTag>[0]) => {
    for (const doc of documents) {
      const slug = slugSegment(doc.slug);
      const id = stringValue(doc._id);
      if (slug) add(sanityDocumentTag(kind, slug));
      if (id) {
        add(sanityDocumentTag(kind, id));
        if (kind === "page" || kind === "page-summary") {
          add(sanityDocumentTag(kind, id.replace(/^[^-]*-/, "")));
        }
      }
    }
  };
  for (const type of new Set(documents.map((doc) => doc._type))) {
    switch (type) {
      case "siteSettings":
        add(sanityTags.settings);
        if (changed("org.name", "org.abbreviation")) add(sanityTags.social);
        break;
      case "sidebar":
        add(sanityTags.sidebar);
        break;
      case "homepage":
        add(sanityTags.homepage);
        if (changed("hero.image")) add(sanityTags.social);
        break;
      case "homepageAbout":
        add(sanityTags.homepageAbout);
        break;
      case "homepageFeatured":
        add(sanityTags.featured);
        break;
      case "navigation":
        add(sanityTags.navigation, sanityTags.navigationRoutes);
        break;
      case "category":
        add(sanityTags.categories, sanityTags.navigation, sanityTags.featured);
        if (lifecycle) add(sanityTags.navigationRoutes, sanityTags.announcementTargets);
        break;
      case "page":
        keys("page");
        // Unversioned hooks cannot identify the old slug, so invalidate the type.
        if (!versioned) add(sanityTags.pages);
        if (changed("title", "slug", "description", "images")) {
          keys("page-summary");
          if (!versioned) add(sanityTags.pageSummaries);
        }
        if (changed("title", "slug")) add(sanityTags.navigation);
        if (changed("slug", "categoryRef")) {
          add(sanityTags.navigationRoutes, sanityTags.pageRoutes, sanityTags.announcementTargets);
        }
        break;
      case "blogPost":
        keys("blog");
        add(sanityTags.blogList, sanityTags.blogRoutes);
        if (!versioned) add(sanityTags.blogDocuments);
        if (changed("title", "slug", "publishedAt", "heroImage", "category"))
          add(sanityTags.blogRelated);
        if (changed("title", "slug", "publishedAt")) add(sanityTags.blogAdjacent);
        if (lifecycle) add(sanityTags.blogCount);
        break;
      case "announcement":
        keys("announcement");
        add(sanityTags.announcements);
        if (!versioned) add(sanityTags.announcementDocuments);
        if (lifecycle) add(sanityTags.announcementCount);
        break;
      // Uploads, drafts, and unrelated Studio documents do not change public data.
    }
  }
  // Fetch tags also invalidate their dependent Full Route Cache entries. Avoid
  // path purges here: those can sweep in unrelated data fetched by the route.
  return { tags: [...tags], paths: [] };
}

function fieldValue(record: UnknownRecord | null, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((value, key) => (isRecord(value) ? value[key] : null), record);
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (isRecord(value))
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value ?? null;
}

function unwrapDocument(payload: unknown): UnknownRecord {
  if (!isRecord(payload)) return {};

  for (const key of ["document", "result", "after", "doc"]) {
    const value = payload[key];
    if (isRecord(value)) return value;
  }

  return payload;
}

function explicitPathTargets(document: UnknownRecord): RevalidationTarget[] {
  const paths = Array.isArray(document.paths) ? document.paths : [];

  return paths.flatMap((entry) => {
    const path = typeof entry === "string" ? entry : isRecord(entry) ? stringValue(entry.path) : "";
    const type = isRecord(entry) && entry.type === "layout" ? "layout" : "page";
    return safePath(path) ? [{ path: normalizePath(path), type }] : [];
  });
}

function safePath(path: unknown): path is string {
  if (typeof path !== "string") return false;

  const trimmed = path.trim();
  if (!trimmed.startsWith("/")) return false;
  if (trimmed.startsWith("//")) return false;
  if (trimmed.includes("..")) return false;
  if (trimmed.includes("\\")) return false;
  if (trimmed.includes(":")) return false;

  return true;
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (trimmed === "/") return "/";
  return trimmed.replace(/\/+$/, "");
}

function slugSegment(value: unknown): string | undefined {
  if (typeof value === "string") return cleanSegment(value);
  if (!isRecord(value)) return undefined;
  return cleanSegment(stringValue(value.current));
}

function cleanSegment(value: string | undefined): string | undefined {
  const segment = value?.trim().replace(/^\/+|\/+$/g, "");
  if (!segment) return undefined;
  if (
    segment.includes("/") ||
    segment.includes("..") ||
    segment.includes("\\") ||
    segment.includes(":")
  ) {
    return undefined;
  }
  return segment;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
