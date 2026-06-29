import { stegaClean } from "next-sanity";

export function documentIdSegment(docId: string | null | undefined): string {
  if (!docId) return "";
  const clean = stegaClean(docId).replace(/^drafts\./, "");
  const dash = clean.indexOf("-");
  return dash >= 0 ? clean.slice(dash + 1) : clean;
}

export function categorySegment(categoryId: string | null | undefined): string {
  return documentIdSegment(categoryId);
}

export function categoryPath(categoryId: string | null | undefined): string {
  const category = categorySegment(categoryId);
  return category ? `/${category}` : "";
}

export function pagePath(categoryId: string | null | undefined, slug: string): string {
  const category = categorySegment(categoryId);
  if (!category || !slug) return "";
  return `/${category}/${slug}`;
}
