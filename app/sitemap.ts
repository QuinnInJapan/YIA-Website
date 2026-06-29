import type { MetadataRoute } from "next";
import { categoryPath, categorySegment, pagePath } from "@/lib/routes";
import { client } from "@/lib/sanity/client";
import { fetchNavigationRouteDocument, navigationRouteGroups } from "@/lib/sanity/navigation-routes";

const BASE_URL = "https://yia.or.jp";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all routes in parallel
  const [nav, blogSlugs] = await Promise.all([
    fetchNavigationRouteDocument(),
    client.fetch<{ slug: string; updatedAt: string }[]>(
      `*[_type == "blogPost"]{ "slug": slug.current, "updatedAt": _updatedAt }`,
    ),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/announcements`, changeFrequency: "weekly", priority: 0.8 },
  ];

  // Blog index only exists while there are published posts
  if ((blogSlugs ?? []).length > 0) {
    entries.push({ url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 });
  }

  // Category and page routes
  for (const { category, pageSlugs } of navigationRouteGroups(nav, categorySegment)) {
    entries.push({
      url: `${BASE_URL}${categoryPath(category)}`,
      changeFrequency: "monthly",
      priority: 0.7,
    });

    for (const slug of pageSlugs) {
      entries.push({
        url: `${BASE_URL}${pagePath(category, slug)}`,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  // Blog posts
  for (const post of blogSlugs ?? []) {
    entries.push({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "yearly",
      priority: 0.5,
    });
  }

  return entries;
}
