import { client } from "./client";
import { sanityFetch } from "./live";

// ── Site Settings ────────────────────────────────────────────────
export async function fetchSiteSettings() {
  const { data } = await sanityFetch({ query: `*[_type == "siteSettings"][0]` });
  return data;
}

// ── Categories ───────────────────────────────────────────────────
export async function fetchCategories() {
  const { data } = await sanityFetch({ query: `*[_type == "category"] | order(_id asc)` });
  return data;
}

// ── Navigation ───────────────────────────────────────────────────
export async function fetchNavigation() {
  const { data } = await sanityFetch({
    query: `*[_type == "navigation"][0]{
      ...,
      categories[]{
        ...,
        categoryRef->,
        items[]{ ..., pageRef-> }
      }
    }`,
  });
  return data;
}

// ── Announcements ────────────────────────────────────────────────
export async function fetchAnnouncements() {
  const { data } = await sanityFetch({ query: `*[_type == "announcement"] | order(date desc)` });
  return data;
}

// ── Sidebar ─────────────────────────────────────────────────────
export async function fetchSidebar() {
  const { data } = await sanityFetch({ query: `*[_type == "sidebar"][0]{ ..., memberRecruitment{ label, "slug": page->slug } }` });
  return data;
}

// ── Homepage ─────────────────────────────────────────────────────
export async function fetchHomepage() {
  const { data } = await sanityFetch({ query: `*[_type == "homepage"][0]{ ..., announcementRefs[]-> }` });
  return data;
}

// ── Pages ────────────────────────────────────────────────────────
export async function fetchAllPages() {
  const { data } = await sanityFetch({ query: `*[_type == "page"] | order(_id asc)` });
  return data;
}

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

// ── Full site data (composite fetch) ─────────────────────────────
export async function fetchSiteData() {
  const [
    site,
    categories,
    navigation,
    announcements,
    sidebar,
    homepage,
    pages,
  ] = await Promise.all([
    fetchSiteSettings(),
    fetchCategories(),
    fetchNavigation(),
    fetchAnnouncements(),
    fetchSidebar(),
    fetchHomepage(),
    fetchAllPages(),
  ]);

  return {
    site,
    categories,
    navigation,
    announcements,
    sidebar,
    homepage,
    pages,
  };
}
