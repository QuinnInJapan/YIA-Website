import type { MetadataRoute } from "next";
import { categoryPath, categorySegment, pagePath } from "@/lib/routes";
import { client } from "@/lib/sanity/client";
import { sanityFetchOptions, sanityTags } from "@/lib/sanity/revalidation";
import { SITE_URL } from "@/lib/site-metadata";
import {
  fetchNavigationRouteDocument,
  navigationRouteGroups,
} from "@/lib/sanity/navigation-routes";

const BASE_URL = SITE_URL;
const published = '!(_id in path("drafts.**")) && !(_id in path("versions.**"))';

// Refresh through the authenticated Sanity webhook, not on a timer.
export const revalidate = false;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all routes in parallel
  const [nav, blogSlugs, announcements, pages] = await Promise.all([
    fetchNavigationRouteDocument(),
    client.fetch<{ slug: string; updatedAt: string }[]>(
      `*[_type == "blogPost" && ${published} && defined(slug.current) && slug.current != ""]{
        "slug": slug.current, "updatedAt": _updatedAt
      }`,
      {},
      sanityFetchOptions(sanityTags.blogRoutes),
    ),
    client.fetch<{ _id: string; slug?: string; updatedAt: string }[]>(
      `*[_type == "announcement" && ${published} && coalesce(destinationType, "detail") != "internalPage"]{
        _id, "slug": slug.current, "updatedAt": _updatedAt
      }`,
      {},
      sanityFetchOptions(sanityTags.announcements),
    ),
    client.fetch<{ slug: string; updatedAt: string }[]>(
      `*[_type == "page" && ${published} && defined(slug)]{
        slug, "updatedAt": _updatedAt
      }`,
      {},
      sanityFetchOptions(sanityTags.sitemapPages),
    ),
  ]);
  const pageUpdatedAt = new Map((pages ?? []).map((page) => [page.slug, page.updatedAt]));

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
        lastModified: pageUpdatedAt.get(slug),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  // Redirect-only announcements are represented by their existing destination page.
  // Prefer the public slug; older announcements may only have a document ID.
  for (const announcement of announcements ?? []) {
    entries.push({
      url: `${BASE_URL}/announcements/${encodeURIComponent(announcement.slug || announcement._id)}`,
      lastModified: announcement.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    });
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

  return [...new Map(entries.map((entry) => [entry.url, entry])).values()];
}
