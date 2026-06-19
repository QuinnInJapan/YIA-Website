export const SANITY_SITE_DATA_TAG = "sanity:site-data";
export const SANITY_REVALIDATE_SECONDS = 60;

export type RevalidationTarget = {
  path: string;
  type: "page" | "layout";
};

type UnknownRecord = Record<string, unknown>;

const GLOBAL_DOCUMENT_TYPES = new Set(["navigation", "siteSettings", "sidebar", "category"]);
const HOMEPAGE_DOCUMENT_TYPES = new Set(["homepage", "homepageAbout", "homepageFeatured"]);

export function resolveSanityRevalidationTargets(payload: unknown): RevalidationTarget[] {
  const document = unwrapDocument(payload);
  const targets: RevalidationTarget[] = [];

  for (const target of explicitPathTargets(document)) {
    addTarget(targets, target.path, target.type);
  }

  if (targets.length > 0) return targets;

  const documentType = stringValue(document._type);
  if (!documentType) return [{ path: "/", type: "layout" }];

  if (GLOBAL_DOCUMENT_TYPES.has(documentType)) {
    return [{ path: "/", type: "layout" }];
  }

  if (HOMEPAGE_DOCUMENT_TYPES.has(documentType)) {
    return [{ path: "/", type: "page" }];
  }

  if (documentType === "page") {
    addTarget(targets, "/", "page");

    const category = categorySegment(document.categoryRef) ?? categorySegment(document.category);
    const slug = slugSegment(document.slug);

    if (category) addTarget(targets, `/${category}`, "page");
    if (category && slug) addTarget(targets, `/${category}/${slug}`, "page");
    if (!category && slug) addTarget(targets, `/${slug}`, "page");

    return targets;
  }

  if (documentType === "announcement") {
    addTarget(targets, "/", "page");
    addTarget(targets, "/announcements", "page");

    const id = slugSegment(document.slug) ?? slugSegment(document._id);
    if (id) addTarget(targets, `/announcements/${id}`, "page");

    return targets;
  }

  if (documentType === "blogPost") {
    addTarget(targets, "/blog", "page");

    const slug = slugSegment(document.slug);
    if (slug) addTarget(targets, `/blog/${slug}`, "page");

    return targets;
  }

  return [{ path: "/", type: "layout" }];
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

function addTarget(targets: RevalidationTarget[], path: string, type: RevalidationTarget["type"]) {
  const normalized = normalizePath(path);
  if (!safePath(normalized)) return;
  if (targets.some((target) => target.path === normalized && target.type === type)) return;
  targets.push({ path: normalized, type });
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

function categorySegment(value: unknown): string | undefined {
  const raw = referenceId(value) ?? slugSegment(value);
  if (!raw) return undefined;
  return cleanSegment(raw.replace(/^drafts\./, "").replace(/^category-/, ""));
}

function referenceId(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  return stringValue(value._ref) ?? stringValue(value._id);
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
