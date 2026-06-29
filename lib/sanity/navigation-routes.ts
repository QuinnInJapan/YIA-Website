export interface NavigationRouteDocument {
  categories?: NavigationRouteCategory[] | null;
}

export interface NavigationRouteCategory {
  categoryRef?: { _id?: string | null } | null;
  items?: NavigationRouteItem[] | null;
}

export interface NavigationRouteItem {
  hidden?: boolean | null;
  pageRef?: { slug?: string | null } | null;
}

export interface NavigationPageParam {
  category: string;
  slug: string;
}

export interface NavigationRouteGroup {
  category: string;
  pageSlugs: string[];
}

export type NavigationCategorySegmenter = (categoryId: string | null | undefined) => string;

export const navigationRouteQuery = `*[_type == "navigation"][0]{
  categories[]{
    categoryRef->{ _id },
    items[]{ pageRef->{ slug } }
  }
}`;

export function navigationCategorySegments(
  navigation: NavigationRouteDocument | null | undefined,
  toSegment: NavigationCategorySegmenter,
): string[] {
  return navigationRouteGroups(navigation, toSegment).map((group) => group.category);
}

export function navigationPageParams(
  navigation: NavigationRouteDocument | null | undefined,
  toSegment: NavigationCategorySegmenter,
): NavigationPageParam[] {
  return navigationRouteGroups(navigation, toSegment).flatMap((group) =>
    group.pageSlugs.map((slug) => ({ category: group.category, slug })),
  );
}

export function navigationRouteGroups(
  navigation: NavigationRouteDocument | null | undefined,
  toSegment: NavigationCategorySegmenter,
): NavigationRouteGroup[] {
  const groups: NavigationRouteGroup[] = [];

  for (const navCat of navigation?.categories ?? []) {
    const category = toSegment(navCat.categoryRef?._id);
    if (!category) continue;

    const pageSlugs: string[] = [];
    for (const item of navCat.items ?? []) {
      if (item.pageRef?.slug) {
        pageSlugs.push(item.pageRef.slug);
      }
    }

    groups.push({ category, pageSlugs });
  }

  return groups;
}

export async function fetchNavigationRouteDocument() {
  const { client } = await import("./client");
  return client.fetch<NavigationRouteDocument | null>(navigationRouteQuery);
}

export async function fetchNavigationCategorySegmentsStatic(
  toSegment: NavigationCategorySegmenter,
): Promise<string[]> {
  return navigationCategorySegments(await fetchNavigationRouteDocument(), toSegment);
}

export async function fetchNavigationPageParamsStatic(
  toSegment: NavigationCategorySegmenter,
): Promise<NavigationPageParam[]> {
  return navigationPageParams(await fetchNavigationRouteDocument(), toSegment);
}
