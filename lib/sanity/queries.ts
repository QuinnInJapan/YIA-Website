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

// ── Global Resources ─────────────────────────────────────────────
export function fetchGlobalResources() {
  return fetchQuery(`*[_type == "globalResources"][0]`);
}

// ── Homepage ─────────────────────────────────────────────────────
export function fetchHomepage() {
  return fetchQuery(`*[_type == "homepage"][0]`);
}

// ── Program Pages ────────────────────────────────────────────────
export function fetchAllProgramPages() {
  return fetchQuery(`*[_type == "programPage"] | order(id asc)`);
}

export function fetchProgramPageBySlug(slug: string) {
  return fetchQuery(
    `*[_type == "programPage" && slug == $slug][0]`,
    { slug }
  );
}

export function fetchAllProgramSlugs() {
  return fetchQuery<{ slug: string }[]>(
    `*[_type == "programPage"]{ slug }`
  );
}

// ── About Page ───────────────────────────────────────────────────
export function fetchAboutPage() {
  return fetchQuery(`*[_type == "aboutPage"][0]`);
}

// ── Membership Page ──────────────────────────────────────────────
export function fetchMembershipPage() {
  return fetchQuery(`*[_type == "membershipPage"][0]`);
}

// ── Directory Page ───────────────────────────────────────────────
export function fetchDirectoryPage() {
  return fetchQuery(`*[_type == "directoryPage"][0]`);
}

// ── Full site data (composite fetch) ─────────────────────────────
export async function fetchSiteData() {
  const [
    site,
    categories,
    navigation,
    announcements,
    globalResources,
    homepage,
    aboutPage,
    membershipPage,
    directoryPage,
    programPages,
  ] = await Promise.all([
    fetchSiteSettings(),
    fetchCategories(),
    fetchNavigation(),
    fetchAnnouncements(),
    fetchGlobalResources(),
    fetchHomepage(),
    fetchAboutPage(),
    fetchMembershipPage(),
    fetchDirectoryPage(),
    fetchAllProgramPages(),
  ]);

  return {
    site,
    categories,
    navigation,
    announcements,
    globalResources,
    homepage,
    aboutPage,
    membershipPage,
    directoryPage,
    programPages,
  };
}
