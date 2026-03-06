import { cache } from "react";
import { stegaClean } from "next-sanity";
import type {
  SiteData,
  SanityImage,
  Page,
  Announcement,
  Category,
} from "./types";
import type { I18nString } from "@/lib/i18n";
import {
  fetchSiteData,
  fetchAnnouncements,
  fetchAllPageSlugsStatic,
} from "./sanity/queries";

// Empty defaults for when Sanity has no data yet
const emptySiteData: SiteData = {
  site: { _type: "siteSettings", org: { designation: "", name: [{_key: "ja", value: ""}, {_key: "en", value: ""}], abbreviation: "", founded: "", npoEstablished: "", lastUpdated: "", description: [{_key: "ja", value: ""}, {_key: "en", value: ""}] }, contact: { postalCode: "", address: [{_key: "ja", value: ""}, {_key: "en", value: ""}], tel: "", fax: "", email: "", website: "" }, businessHours: [{_key: "ja", value: ""}, {_key: "en", value: ""}], copyright: "", googleMapsEmbedUrl: "" },
  categories: [],
  navigation: { _type: "navigation", categories: [] },
  announcements: [],
  sidebar: { _type: "sidebar", memberRecruitment: { label: [{_key: "ja", value: ""}, {_key: "en", value: ""}], slug: "" }, documents: [] },
  homepage: { _type: "homepage", slug: "", hero: { tagline: [{_key: "ja", value: ""}, {_key: "en", value: ""}] }, activityGrid: { images: [], stat: { value: 0, label: [{_key: "ja", value: ""}, {_key: "en", value: ""}] } }, announcementRefs: [] },
  pages: [],
};

// Cache the full site data fetch per request (React server-component dedup)
export const getSiteData = cache(async (): Promise<SiteData> => {
  const raw = await fetchSiteData();
  // If Sanity is empty, return defaults so the site still builds
  if (!raw || !raw.site) return emptySiteData;
  return {
    ...emptySiteData,
    ...raw,
    categories: raw.categories || [],
    announcements: raw.announcements || [],
    pages: raw.pages || [],
    navigation: raw.navigation || emptySiteData.navigation,
    sidebar: raw.sidebar || emptySiteData.sidebar,
    homepage: raw.homepage || emptySiteData.homepage,
  } as SiteData;
});

// ── Category index ──────────────────────────────────────────────

export async function getCategoryIndex(): Promise<Record<string, Category>> {
  const data = await getSiteData();
  const index: Record<string, Category> = {};
  for (const cat of data.categories) {
    index[stegaClean(cat.id)] = cat;
  }
  return index;
}

// ── Navigation enrichment ───────────────────────────────────────

interface EnrichedNavItem {
  id: string;
  title: I18nString;
  url: string;
}

interface EnrichedNavCategory {
  categoryId: string;
  id: string;
  label: I18nString;
  description?: I18nString;
  heroImage?: SanityImage;
  items: EnrichedNavItem[];
}

interface EnrichedNavigation {
  categories: EnrichedNavCategory[];
}

export const getEnrichedNavigation = cache(
  async (): Promise<EnrichedNavigation> => {
    const data = await getSiteData();
    const categoryIndex: Record<string, Category> = {};
    for (const cat of data.categories) {
      categoryIndex[stegaClean(cat.id)] = cat;
    }

    // Build page index keyed by various ID forms so pageRef._ref resolves
    const pageIndex: Record<string, Page> = {};
    for (const pg of data.pages) {
      const cleanId = stegaClean(pg.id);
      pageIndex[`page-${cleanId}`] = pg;
      pageIndex[cleanId] = pg;
      const docId = stegaClean((pg as unknown as { _id?: string })._id ?? "");
      if (docId) pageIndex[docId] = pg;
    }

    function resolvePage(ref?: { _ref?: string }): Page | undefined {
      if (!ref?._ref) return undefined;
      const refStr = stegaClean(ref._ref);
      return pageIndex[refStr] || pageIndex[refStr.replace("page-", "")];
    }

    const categories: EnrichedNavCategory[] =
      data.navigation.categories.map((navCat) => {
        const catId = stegaClean(navCat.categoryRef?._ref?.replace("category-", "") ?? "");
        const cat = categoryIndex[catId];
        return {
          categoryId: catId,
          id: stegaClean(cat?.id ?? catId),
          label: cat?.label ?? [],
          description: cat?.description,
          heroImage: cat?.heroImage,
          items: (navCat.items ?? []).map((item) => {
            const pg = resolvePage(item.pageRef);
            return {
              id: pg ? stegaClean(pg.id) : "",
              title: pg?.title ?? [],
              url: pg ? `/${stegaClean(pg.slug)}` : "",
            };
          }),
        };
      });

    // Append contact link to the "about" category
    const aboutCat = categories.find((c) => c.categoryId === "about");
    if (aboutCat) {
      aboutCat.items.push({
        id: "contact",
        title: [
          { _key: "ja", value: "お問い合わせ" },
          { _key: "en", value: "Contact" },
        ],
        url: "/contact",
      });
    }

    return { categories };
  }
);

// ── Pages ────────────────────────────────────────────────────────

export async function getPage(
  slug: string
): Promise<Page | undefined> {
  const data = await getSiteData();
  return data.pages.find((pg) => stegaClean(pg.id) === slug || stegaClean(pg.slug) === slug);
}

export async function getAllPageSlugs(): Promise<string[]> {
  // Uses raw client to avoid draftMode() dependency in generateStaticParams
  const pages = await fetchAllPageSlugsStatic();
  return pages.map((pg) => pg.slug);
}

export async function getAllPages(): Promise<Page[]> {
  const data = await getSiteData();
  return data.pages;
}

// ── Pages by category ───────────────────────────────────────────

export async function getPagesByCategory(categoryId: string): Promise<Page[]> {
  const data = await getSiteData();
  return data.pages.filter(
    (pg) => stegaClean(pg.categoryRef?._ref) === `category-${categoryId}`
  );
}

// ── Announcements ───────────────────────────────────────────────

export async function getAnnouncementsByRefs(
  refs: ({ _type: "reference"; _ref: string } | string)[]
): Promise<Announcement[]> {
  if (!refs?.length) return [];
  const data = await getSiteData();
  const index: Record<string, Announcement> = {};
  for (const a of data.announcements) {
    // Documents have _id like "announcement-<id>" in Sanity
    const cleanId = stegaClean(a.id);
    index[`announcement-${cleanId}`] = a;
    index[cleanId] = a;
  }
  return refs
    .map((ref) => {
      const id = stegaClean(typeof ref === "string" ? ref : ref._ref);
      return index[id];
    })
    .filter(Boolean);
}
