import { cache } from "react";
import { client } from "./client";

// ── Timing helper ───────────────────────────────────────────────
async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const ms = (performance.now() - start).toFixed(1);
  console.log(`⏱ [sanity] ${label}: ${ms}ms`);
  return result;
}

// ── Full site data (single composite GROQ query) ────────────────
export async function fetchSiteData() {
  return timed("fetchSiteData (1 query)", async () => {
    return client.fetch(`{
        "site": *[_type == "siteSettings"][0],
        "categories": *[_type == "category"] | order(_id asc),
        "navigation": *[_type == "navigation"][0]{
          ...,
          categories[]{
            ...,
            categoryRef->,
            items[]{ ..., pageRef-> }
          }
        },
        "announcements": *[_type == "announcement"] | order(date desc) { ..., "slug": slug.current },
        "sidebar": *[_type == "sidebar"][0]{ ... },
        "homepage": *[_type == "homepage"][0]{ ..., announcementRefs[]-> },
        "homepageFeatured": *[_type == "homepageFeatured"][0]{
          categories[]->
        },
        "pages": *[_type == "page"] | order(_id asc)
      }`);
  });
}

// ── Homepage "About" variant (standalone singleton) ─────────────
export async function fetchHomepageAbout() {
  return timed("homepageAbout", async () => {
    return client.fetch(`*[_type == "homepageAbout"][0]`);
  });
}

// ── Single page fetch ───────────────────────────────────────────
export async function fetchPageBySlug(slug: string) {
  return client.fetch(`*[_type == "page" && slug == $slug][0]`, { slug });
}

export async function fetchAllPageSlugs() {
  return client.fetch(`*[_type == "page"]{ slug }`);
}

// Static version for generateStaticParams (no draftMode dependency)
export function fetchAllPageSlugsStatic() {
  return client.fetch<{ slug: string }[]>(`*[_type == "page"]{ slug }`);
}

// ── Blog Posts ──────────────────────────────────────────────────
export async function fetchBlogPosts(page = 1, pageSize = 10) {
  return timed("blogPosts", async () => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return client.fetch(
      `*[_type == "blogPost"] | order(publishedAt desc) [$start...$end] {
        ...,
        "slug": slug.current
      }`,
      { start, end },
    );
  });
}

// Deduped with cache() so generateMetadata + page component share one fetch
export const fetchBlogPostBySlug = cache(async (slug: string) => {
  return timed(`blogPost[${slug}]`, async () => {
    return client.fetch(
      `*[_type == "blogPost" && slug.current == $slug][0] {
        ...,
        "slug": slug.current,
        relatedPosts[]-> { ..., "slug": slug.current }
      }`,
      { slug },
    );
  });
});

export async function fetchAdjacentBlogPosts(publishedAt: string, slug: string) {
  return timed("adjacentBlogPosts", async () => {
    return (await client.fetch(
      `{
        "prev": *[_type == "blogPost" && (
          publishedAt > $publishedAt ||
          (publishedAt == $publishedAt && slug.current > $slug)
        )] | order(publishedAt asc, slug.current asc) [0] {
          title, "slug": slug.current
        },
        "next": *[_type == "blogPost" && (
          publishedAt < $publishedAt ||
          (publishedAt == $publishedAt && slug.current < $slug)
        )] | order(publishedAt desc, slug.current desc) [0] {
          title, "slug": slug.current
        }
      }`,
      { publishedAt, slug },
    )) as {
      prev: { title: { _key: string; value: string }[]; slug: string } | null;
      next: { title: { _key: string; value: string }[]; slug: string } | null;
    };
  });
}

export async function fetchBlogPostCount() {
  return timed("blogPostCount", async () => {
    return client.fetch(`count(*[_type == "blogPost"])`);
  });
}

// ── Announcements (paginated) ───────────────────────────────────
export async function fetchAnnouncements(page = 1, pageSize = 10) {
  return timed("announcements", async () => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return client.fetch(
      `*[_type == "announcement"] | order(pinned desc, date desc) [$start...$end] {
        ...,
        "slug": slug.current
      }`,
      { start, end },
    );
  });
}

export async function fetchAnnouncementCount() {
  return timed("announcementCount", async () => {
    return client.fetch(`count(*[_type == "announcement"])`);
  });
}

export async function fetchAnnouncementById(id: string) {
  return timed(`announcement[${id}]`, async () => {
    return client.fetch(
      `*[_type == "announcement" && _id == $id][0] { ..., "slug": slug.current }`,
      { id },
    );
  });
}

export async function fetchAnnouncementBySlug(slug: string) {
  return timed(`announcement[slug:${slug}]`, async () => {
    return client.fetch(
      `*[_type == "announcement" && slug.current == $slug][0] { ..., "slug": slug.current }`,
      { slug },
    );
  });
}

export function fetchAllAnnouncementIdsStatic() {
  return client.fetch<{ _id: string; slug?: string }[]>(
    `*[_type == "announcement"]{ _id, "slug": slug.current }`,
  );
}

export function fetchAllBlogSlugsStatic() {
  return client.fetch<{ slug: string }[]>(`*[_type == "blogPost"]{ "slug": slug.current }`);
}
