import { cache } from "react";
import { client } from "./client";
import { sanityFetch } from "./live";

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
    const { data } = await sanityFetch({
      query: `{
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
        "sidebar": *[_type == "sidebar"][0]{
          ...,
          memberRecruitment{ label, "slug": page->slug }
        },
        "homepage": *[_type == "homepage"][0]{ ..., announcementRefs[]-> },
        "pages": *[_type == "page"] | order(_id asc)
      }`,
    });
    return data;
  });
}

// ── Homepage "About" variant (standalone singleton) ─────────────
export async function fetchHomepageAbout() {
  return timed("homepageAbout", async () => {
    const { data } = await sanityFetch({
      query: `*[_type == "homepageAbout"][0]`,
    });
    return data;
  });
}

// ── Single page fetch ───────────────────────────────────────────
export async function fetchPageBySlug(slug: string) {
  const { data } = await sanityFetch({
    query: `*[_type == "page" && slug == $slug][0]`,
    params: { slug },
  });
  return data;
}

export async function fetchAllPageSlugs() {
  const { data } = await sanityFetch({
    query: `*[_type == "page"]{ slug }`,
  });
  return data;
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
    const { data } = await sanityFetch({
      query: `*[_type == "blogPost"] | order(publishedAt desc) [$start...$end] {
        ...,
        "slug": slug.current
      }`,
      params: { start, end },
    });
    return data;
  });
}

// Deduped with cache() so generateMetadata + page component share one fetch
export const fetchBlogPostBySlug = cache(async (slug: string) => {
  return timed(`blogPost[${slug}]`, async () => {
    const { data } = await sanityFetch({
      query: `*[_type == "blogPost" && slug.current == $slug][0] {
        ...,
        "slug": slug.current,
        relatedPosts[]-> { ..., "slug": slug.current }
      }`,
      params: { slug },
    });
    return data;
  });
});

export async function fetchAdjacentBlogPosts(publishedAt: string, slug: string) {
  return timed("adjacentBlogPosts", async () => {
    const { data } = await sanityFetch({
      query: `{
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
      params: { publishedAt, slug },
    });
    return data as {
      prev: { title: { _key: string; value: string }[]; slug: string } | null;
      next: { title: { _key: string; value: string }[]; slug: string } | null;
    };
  });
}

export async function fetchBlogPostCount() {
  return timed("blogPostCount", async () => {
    const { data } = await sanityFetch({
      query: `count(*[_type == "blogPost"])`,
    });
    return data;
  });
}

// ── Announcements (paginated) ───────────────────────────────────
export async function fetchAnnouncements(page = 1, pageSize = 10) {
  return timed("announcements", async () => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const { data } = await sanityFetch({
      query: `*[_type == "announcement"] | order(pinned desc, date desc) [$start...$end] {
        ...,
        "slug": slug.current
      }`,
      params: { start, end },
    });
    return data;
  });
}

export async function fetchAnnouncementCount() {
  return timed("announcementCount", async () => {
    const { data } = await sanityFetch({
      query: `count(*[_type == "announcement"])`,
    });
    return data;
  });
}

export async function fetchAnnouncementBySlug(slug: string) {
  return timed(`announcement[${slug}]`, async () => {
    const { data } = await sanityFetch({
      query: `*[_type == "announcement" && slug.current == $slug][0] {
        ...,
        "slug": slug.current
      }`,
      params: { slug },
    });
    return data;
  });
}

export async function fetchAnnouncementById(id: string) {
  return timed(`announcement[${id}]`, async () => {
    const { data } = await sanityFetch({
      query: `*[_type == "announcement" && _id == $id][0] {
        ...,
        "slug": slug.current
      }`,
      params: { id },
    });
    return data;
  });
}

export function fetchAllAnnouncementSlugsStatic() {
  return client.fetch<{ slug: string }[]>(
    `*[_type == "announcement" && defined(slug.current)]{ "slug": slug.current }`,
  );
}

export function fetchAllAnnouncementIdsStatic() {
  return client.fetch<{ _id: string }[]>(`*[_type == "announcement"]{ _id }`);
}

export function fetchAllBlogSlugsStatic() {
  return client.fetch<{ slug: string }[]>(`*[_type == "blogPost"]{ "slug": slug.current }`);
}
