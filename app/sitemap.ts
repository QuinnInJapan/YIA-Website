import type { MetadataRoute } from "next";
import { client } from "@/lib/sanity/client";

const BASE_URL = "https://yia.or.jp";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all routes in parallel
  const [nav, blogSlugs] = await Promise.all([
    client.fetch<{
      categories: {
        categoryRef: { _id: string };
        items: { pageRef: { slug: string } }[];
      }[];
    }>(
      `*[_type == "navigation"][0]{
        categories[]{
          categoryRef->{ _id },
          items[]{ pageRef->{ slug } }
        }
      }`
    ),
    client.fetch<{ slug: string; updatedAt: string }[]>(
      `*[_type == "blogPost"]{ "slug": slug.current, "updatedAt": _updatedAt }`
    ),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/announcements`, changeFrequency: "weekly", priority: 0.8 },
  ];

  // Category and page routes
  for (const cat of nav?.categories ?? []) {
    const categoryId = cat.categoryRef._id;
    entries.push({
      url: `${BASE_URL}/${categoryId}`,
      changeFrequency: "monthly",
      priority: 0.7,
    });
    for (const item of cat.items ?? []) {
      if (item.pageRef?.slug) {
        entries.push({
          url: `${BASE_URL}/${categoryId}/${item.pageRef.slug}`,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
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
