import { client } from "./client";

// Revalidate every 60 seconds for ISR
const REVALIDATE = 60;

function fetchQuery<T>(query: string, params?: Record<string, unknown>): Promise<T> {
  return client.fetch<T>(query, params ?? {}, { next: { revalidate: REVALIDATE } });
}

// ── Site Settings ────────────────────────────────────────────────
export function fetchSiteSettings() {
  return fetchQuery(`*[_type == "siteSettings"][0]`);
}

// ── Categories ───────────────────────────────────────────────────
export function fetchCategories() {
  return fetchQuery(`*[_type == "category"] | order(id asc)`);
}

// ── Navigation ───────────────────────────────────────────────────
export function fetchNavigation() {
  return fetchQuery(`*[_type == "navigation"][0]`);
}

// ── Announcements ────────────────────────────────────────────────
export function fetchAnnouncements() {
  return fetchQuery(`*[_type == "announcement"] | order(date desc)`);
}

// ── Sidebar ─────────────────────────────────────────────────────
export function fetchSidebar() {
  return fetchQuery(`*[_type == "sidebar"][0]`);
}

// ── Homepage ─────────────────────────────────────────────────────
export function fetchHomepage() {
  return fetchQuery(`*[_type == "homepage"][0]`);
}

// ── Pages ────────────────────────────────────────────────────────
export function fetchAllPages() {
  return fetchQuery(`*[_type == "page"] | order(id asc)`);
}

export function fetchPageBySlug(slug: string) {
  return fetchQuery(
    `*[_type == "page" && slug == $slug][0]`,
    { slug }
  );
}

export function fetchAllPageSlugs() {
  return fetchQuery<{ slug: string }[]>(
    `*[_type == "page"]{ slug }`
  );
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
