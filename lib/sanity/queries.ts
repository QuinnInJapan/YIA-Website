import { cache } from "react";
import { client } from "./client";
import { sanityFetchOptions, sanityTags as tags, sanityDocumentTag } from "./revalidation";
import type {
  SiteSettings,
  Sidebar,
  Homepage,
  HomepageFeatured,
  Category,
  Navigation,
  Page,
  Announcement,
  SanityImage,
} from "../types";
import type { I18nString } from "../i18n";

// ── Timing helper ───────────────────────────────────────────────
async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const ms = (performance.now() - start).toFixed(1);
  console.log(`⏱ [sanity] ${label}: ${ms}ms`);
  return result;
}

// Each query describes one independently invalidated dependency. Navigation
// deliberately projects titles/URLs only, never referenced page bodies.
export const fetchSiteSettings = () =>
  client.fetch<SiteSettings | null>(
    `*[_type == "siteSettings"][0]`,
    {},
    sanityFetchOptions(tags.settings),
  );
export const fetchSidebar = () =>
  client.fetch<Sidebar | null>(`*[_type == "sidebar"][0]`, {}, sanityFetchOptions(tags.sidebar));
export const fetchCategories = () =>
  client.fetch<Category[]>(
    `*[_type == "category"] | order(_id asc)`,
    {},
    sanityFetchOptions(tags.categories),
  );
export const fetchNavigation = () =>
  client.fetch<Navigation | null>(
    `*[_type == "navigation"][0]{_type, categories[]{
    categoryRef->{_id, _type, label, description, heroImage},
    items[]{hidden, pageRef->{_id, slug, title}}
  }}`,
    {},
    sanityFetchOptions(tags.navigation),
  );
export const fetchHomepage = () =>
  client.fetch<Homepage | null>(`*[_type == "homepage"][0]`, {}, sanityFetchOptions(tags.homepage));
export const fetchHomepageFeatured = () =>
  client.fetch<HomepageFeatured | null>(
    `*[_type == "homepageFeatured"][0]{_type, categories[]->{_id, _type, label, heroImage}}`,
    {},
    sanityFetchOptions(tags.featured),
  );
export const fetchSocialImageData = () =>
  client.fetch<{
    heroImage: SanityImage | null;
    org: { name?: I18nString; abbreviation?: string } | null;
  }>(
    `{
  "heroImage": *[_type == "homepage"][0].hero.image,
  "org": *[_type == "siteSettings"][0].org{name, abbreviation}
}`,
    {},
    sanityFetchOptions(tags.social),
  );

// The homepage displays the five newest pinned-first announcement links. It
// does not render their bodies or use the retired announcementRefs selection.
export const fetchHomepageAnnouncements = () =>
  client.fetch<Announcement[]>(
    `*[_type == "announcement"] | order(coalesce(pinned, false) desc, date desc) [0...5] {
    _id, _type, title, date, pinned, destinationType, targetAnchor,
    "slug": slug.current,
    "targetPageData": targetPage->{_id, slug, "categoryId": categoryRef->_id}
  }`,
    {},
    sanityFetchOptions(tags.announcements, tags.announcementTargets),
  );

// ── Homepage "About" variant (standalone singleton) ─────────────
export async function fetchHomepageAbout() {
  return timed("homepageAbout", async () => {
    return client.fetch(
      `*[_type == "homepageAbout" && !(_id in path("drafts.**"))] | order(_updatedAt desc)[0]`,
      {},
      sanityFetchOptions(tags.homepageAbout),
    );
  });
}

// ── Single page fetch ───────────────────────────────────────────
// NOTE: full document fetch — sections[]._key must be present for StudioRegion studioId matching
export async function fetchPageBySlug(slug: string) {
  return client.fetch<Page | null>(
    `*[_type == "page" && (slug == $slug || array::join(string::split(_id, "-")[1..-1], "-") == $slug || _id == $slug)] | order(_id asc)[0]`,
    { slug },
    sanityFetchOptions(tags.pages, sanityDocumentTag("page", slug)),
  );
}

export type PageSummary = Pick<Page, "_id" | "title" | "slug" | "description" | "images">;
export const fetchPageSummary = (slug: string) =>
  client.fetch<PageSummary | null>(
    `*[_type == "page" && (slug == $slug || array::join(string::split(_id, "-")[1..-1], "-") == $slug || _id == $slug)] | order(_id asc)[0]{_id, title, slug, description, images}`,
    { slug },
    sanityFetchOptions(tags.pageSummaries, sanityDocumentTag("page-summary", slug)),
  );

export async function fetchAllPageSlugs() {
  return client.fetch(`*[_type == "page"]{ slug }`, {}, sanityFetchOptions(tags.pageRoutes));
}

// Static version for generateStaticParams (no draftMode dependency)
export function fetchAllPageSlugsStatic() {
  return client.fetch<{ slug: string }[]>(
    `*[_type == "page"]{ slug }`,
    {},
    sanityFetchOptions(tags.pageRoutes),
  );
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
      sanityFetchOptions(tags.blogList),
    );
  });
}

// Deduped with cache() so generateMetadata + page component share one fetch
export const fetchBlogPostBySlug = cache(async (slug: string) => {
  return timed(`blogPost[${slug}]`, async () => {
    const post = await client.fetch(
      `*[_type == "blogPost" && slug.current == $slug][0] {
        ...,
        "slug": slug.current,
        relatedPosts[]-> { _id, title, heroImage, publishedAt, category, "slug": slug.current }
      }`,
      { slug },
      sanityFetchOptions(tags.blogDocuments, sanityDocumentTag("blog", slug), tags.blogRelated),
    );
    // A deleted/unpublished reference dereferences to null.
    return post && { ...post, relatedPosts: post.relatedPosts?.filter(Boolean) };
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
      sanityFetchOptions(tags.blogAdjacent),
    )) as {
      prev: { title: { _key: string; value: string }[]; slug: string } | null;
      next: { title: { _key: string; value: string }[]; slug: string } | null;
    };
  });
}

export async function fetchBlogPostCount() {
  return timed("blogPostCount", async () => {
    return client.fetch(`count(*[_type == "blogPost"])`, {}, sanityFetchOptions(tags.blogCount));
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
        "slug": slug.current,
        "targetPageData": targetPage->{ _id, slug, "categoryId": categoryRef->_id }
      }`,
      { start, end },
      sanityFetchOptions(tags.announcements, tags.announcementTargets),
    );
  });
}

export async function fetchAnnouncementCount() {
  return timed("announcementCount", async () => {
    return client.fetch(
      `count(*[_type == "announcement"])`,
      {},
      sanityFetchOptions(tags.announcementCount),
    );
  });
}

export async function fetchAnnouncementById(id: string) {
  return timed(`announcement[${id}]`, async () => {
    return client.fetch(
      `*[_type == "announcement" && _id == $id][0] {
        ...,
        "slug": slug.current,
        "targetPageData": targetPage->{ _id, slug, "categoryId": categoryRef->_id }
      }`,
      { id },
      sanityFetchOptions(
        tags.announcementDocuments,
        sanityDocumentTag("announcement", id),
        tags.announcementTargets,
      ),
    );
  });
}

export async function fetchAnnouncementBySlug(slug: string) {
  return timed(`announcement[slug:${slug}]`, async () => {
    return client.fetch(
      `*[_type == "announcement" && slug.current == $slug][0] {
        ...,
        "slug": slug.current,
        "targetPageData": targetPage->{ _id, slug, "categoryId": categoryRef->_id }
      }`,
      { slug },
      sanityFetchOptions(
        tags.announcementDocuments,
        sanityDocumentTag("announcement", slug),
        tags.announcementTargets,
      ),
    );
  });
}

export function fetchAllAnnouncementIdsStatic() {
  return client.fetch<{ _id: string; slug?: string }[]>(
    `*[_type == "announcement" && coalesce(destinationType, "detail") != "internalPage"]{
      _id,
      "slug": slug.current
    }`,
    {},
    sanityFetchOptions(tags.announcements),
  );
}

export function fetchAllBlogSlugsStatic() {
  return client.fetch<{ slug: string }[]>(
    `*[_type == "blogPost"]{ "slug": slug.current }`,
    {},
    sanityFetchOptions(tags.blogRoutes),
  );
}
