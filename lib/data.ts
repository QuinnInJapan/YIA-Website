import { cache } from "react";
import { stegaClean } from "next-sanity";
import type { SiteData, SanityImage, Page, Category } from "./types";
import type { I18nString } from "@/lib/i18n";
import {
  fetchSiteSettings,
  fetchSidebar,
  fetchHomepage,
  fetchHomepageFeatured,
  fetchCategories,
  fetchNavigation,
  fetchHomepageAnnouncements,
  fetchPageBySlug,
  fetchPageSummary,
  fetchAllPageSlugsStatic,
} from "./sanity/queries";
import { fetchNavigationCategorySegmentsStatic } from "./sanity/navigation-routes";
import {
  categoryPath,
  categorySegment,
  documentIdSegment,
  pagePath as buildPagePath,
} from "./routes";

/** Strip the type prefix from a Sanity _id (e.g. "category-support" → "support") */
export function shortId(docId: string | undefined): string {
  return documentIdSegment(docId);
}

// Empty defaults for when Sanity has no data yet
const emptySiteData: SiteData = {
  site: {
    _type: "siteSettings",
    org: {
      designation: "",
      name: [
        { _key: "ja", value: "" },
        { _key: "en", value: "" },
      ],
      abbreviation: "",
      founded: "",
      npoEstablished: "",
      lastUpdated: "",
      description: [
        { _key: "ja", value: "" },
        { _key: "en", value: "" },
      ],
    },
    contact: {
      postalCode: "",
      address: [
        { _key: "ja", value: "" },
        { _key: "en", value: "" },
      ],
      tel: "",
      fax: "",
      email: "",
      website: "",
    },
    businessHours: [
      { _key: "ja", value: "" },
      { _key: "en", value: "" },
    ],
    copyright: "",
    googleMapsEmbedUrl: "",
  },
  categories: [],
  navigation: { _type: "navigation", categories: [] },
  announcements: [],
  sidebar: { _type: "sidebar", documents: [] },
  homepage: {
    _type: "homepage",
    slug: "",
    hero: {
      tagline: [
        { _key: "ja", value: "" },
        { _key: "en", value: "" },
      ],
    },
    activityGrid: {
      images: [],
      stat: {
        value: 0,
        label: [
          { _key: "ja", value: "" },
          { _key: "en", value: "" },
        ],
      },
    },
    announcementRefs: [],
  },
  pages: [],
  homepageFeatured: {
    _type: "homepageFeatured" as const,
    categories: [],
  },
};

// React cache deduplicates each dependency within a render. The Sanity fetch
// tags independently retain it between requests until a relevant publish.
export const getSiteSettings = cache(async () => (await fetchSiteSettings()) ?? emptySiteData.site);
export const getSidebar = cache(async () => (await fetchSidebar()) ?? emptySiteData.sidebar);
export const getHomepage = cache(async () => (await fetchHomepage()) ?? emptySiteData.homepage);
export const getHomepageData = cache(async () => {
  const [site, sidebar, homepage, announcements] = await Promise.all([
    getSiteSettings(),
    getSidebar(),
    getHomepage(),
    fetchHomepageAnnouncements(),
  ]);
  return { site, sidebar, homepage, announcements: announcements ?? [] };
});

// ── Category index ──────────────────────────────────────────────

export async function getCategoryIndex(): Promise<Record<string, Category>> {
  const categories = await fetchCategories();
  const index: Record<string, Category> = {};
  for (const cat of categories ?? []) {
    index[shortId(cat._id)] = cat;
  }
  return index;
}

// ── Navigation enrichment ───────────────────────────────────────

interface EnrichedNavItem {
  id: string;
  slug: string;
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

export const getEnrichedNavigation = cache(async (): Promise<EnrichedNavigation> => {
  const navigation = (await fetchNavigation()) ?? emptySiteData.navigation;

  const categories: EnrichedNavCategory[] = (navigation.categories ?? []).map((navCat) => {
    const cat = navCat.categoryRef;
    const catId = shortId(cat?._id);
    return {
      categoryId: catId,
      id: catId,
      label: cat?.label ?? [],
      description: cat?.description,
      heroImage: cat?.heroImage,
      items: (navCat.items ?? [])
        .filter((item) => !item.hidden)
        .map((item) => {
          const pg = item.pageRef;
          const pgSlug = pg ? stegaClean(pg.slug) : "";
          return {
            id: pg ? shortId(pg._id) : "",
            slug: pgSlug,
            title: pg?.title ?? [],
            url: catId && pgSlug ? buildPagePath(catId, pgSlug) : "",
          };
        }),
    };
  });

  return { categories };
});

// ── Homepage featured categories ────────────────────────────────

export interface FeaturedCard {
  categoryId: string;
  label: I18nString;
  heroImage: SanityImage;
  categoryUrl: string;
  pages: { id: string; title: I18nString; url: string }[];
}

export const getHomepageFeatured = cache(async (): Promise<FeaturedCard[]> => {
  const [featured, nav] = await Promise.all([fetchHomepageFeatured(), getEnrichedNavigation()]);
  const categories = (featured?.categories ?? []).filter(Boolean);

  return categories.map((cat) => {
    const catId = shortId(cat._id);
    const navCat = nav.categories.find((c) => c.categoryId === catId);
    return {
      categoryId: catId,
      label: cat.label ?? [],
      heroImage: cat.heroImage,
      categoryUrl: categoryPath(catId),
      pages: (navCat?.items ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
      })),
    };
  });
});

// ── Category IDs from navigation ─────────────────────────────────

export async function getCategoryIds(): Promise<string[]> {
  const nav = await getEnrichedNavigation();
  return nav.categories.map((c) => c.categoryId);
}

// Static version for generateStaticParams (no draftMode dependency)
export async function getCategoryIdsStatic(): Promise<string[]> {
  return fetchNavigationCategorySegmentsStatic(categorySegment);
}

// ── Pages ────────────────────────────────────────────────────────

export const getPage = cache(
  async (slug: string): Promise<Page | undefined> =>
    (await fetchPageBySlug(stegaClean(slug))) ?? undefined,
);
export const getPageSummary = cache(
  async (slug: string) => (await fetchPageSummary(stegaClean(slug))) ?? undefined,
);

export async function getAllPageSlugs(): Promise<string[]> {
  // Uses raw client to avoid draftMode() dependency in generateStaticParams
  const pages = await fetchAllPageSlugsStatic();
  return pages.map((pg) => pg.slug);
}

// ── URL builder ─────────────────────────────────────────────

/** Derive the canonical URL for a page slug from navigation data. */
export async function pageUrl(slug: string): Promise<string> {
  const nav = await getEnrichedNavigation();
  for (const cat of nav.categories) {
    for (const item of cat.items) {
      if (item.slug === slug) return buildPagePath(cat.categoryId, slug);
    }
  }
  return `/${slug}`; // fallback for uncategorized pages
}
