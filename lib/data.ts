import { cache } from "react";
import { stegaClean } from "next-sanity";
import type { SiteData, SanityImage, Page, Category } from "./types";
import type { I18nString } from "@/lib/i18n";
import { fetchSiteData, fetchAllPageSlugsStatic } from "./sanity/queries";

/** Strip the type prefix from a Sanity _id (e.g. "category-support" → "support") */
export function shortId(docId: string | undefined): string {
  if (!docId) return "";
  const clean = stegaClean(docId);
  const dash = clean.indexOf("-");
  return dash >= 0 ? clean.slice(dash + 1) : clean;
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
    slot1: {
      categoryRef: {
        _type: "category" as const,
        _id: "",
        label: [],
        heroImage: { asset: { _ref: "" } },
      },
      pages: [],
    },
    slot2: {
      categoryRef: {
        _type: "category" as const,
        _id: "",
        label: [],
        heroImage: { asset: { _ref: "" } },
      },
      pages: [],
    },
    slot3: {
      categoryRef: {
        _type: "category" as const,
        _id: "",
        label: [],
        heroImage: { asset: { _ref: "" } },
      },
      pages: [],
    },
    slot4: {
      categoryRef: {
        _type: "category" as const,
        _id: "",
        label: [],
        heroImage: { asset: { _ref: "" } },
      },
      pages: [],
    },
  },
};

/**
 * Fetch and return the full site data from Sanity.
 *
 * Wrapped in React `cache()` so that multiple calls within the same
 * server-request are deduplicated automatically — no prop-drilling needed.
 * Every page/layout that calls `getSiteData()` shares the same promise.
 */
export const getSiteData = cache(async (): Promise<SiteData> => {
  const start = performance.now();
  const raw = await fetchSiteData();
  const ms = (performance.now() - start).toFixed(1);
  console.log(`⏱ [data] getSiteData: ${ms}ms`);
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
    homepageFeatured: raw.homepageFeatured || emptySiteData.homepageFeatured,
  } as SiteData;
});

// ── Category index ──────────────────────────────────────────────

export async function getCategoryIndex(): Promise<Record<string, Category>> {
  const data = await getSiteData();
  const index: Record<string, Category> = {};
  for (const cat of data.categories) {
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
  const data = await getSiteData();

  const categories: EnrichedNavCategory[] = data.navigation.categories.map((navCat) => {
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
            url: pgSlug ? `/${catId}/${pgSlug}` : "",
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
  const data = await getSiteData();
  const featured = data.homepageFeatured;
  const slots = [featured.slot1, featured.slot2, featured.slot3, featured.slot4];

  return slots
    .filter((slot) => slot?.categoryRef?._id)
    .map((slot) => {
      const cat = slot.categoryRef;
      const catId = shortId(cat._id);
      return {
        categoryId: catId,
        label: cat.label ?? [],
        heroImage: cat.heroImage,
        categoryUrl: `/${catId}`,
        pages: (slot.pages ?? []).slice(0, 4).map((pg) => {
          const pgSlug = pg ? stegaClean(pg.slug) : "";
          return {
            id: pg ? shortId(pg._id) : "",
            title: pg?.title ?? [],
            url: pgSlug ? `/${catId}/${pgSlug}` : "",
          };
        }),
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
  const { client } = await import("./sanity/client");
  const nav = await client.fetch<{ categories: { categoryRef: { _id: string } }[] }>(
    `*[_type == "navigation"][0]{ categories[]{ categoryRef-> { _id } } }`,
  );
  return (nav?.categories ?? []).map((c) => shortId(c.categoryRef?._id)).filter(Boolean);
}

// ── Pages ────────────────────────────────────────────────────────

export async function getPage(slug: string): Promise<Page | undefined> {
  const data = await getSiteData();
  return data.pages.find((pg) => shortId(pg._id) === slug || stegaClean(pg.slug) === slug);
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
  return data.pages.filter((pg) => stegaClean(pg.categoryRef?._ref) === `category-${categoryId}`);
}

// ── URL builder ─────────────────────────────────────────────

/** Derive the canonical URL for a page slug from navigation data. */
export async function pageUrl(slug: string): Promise<string> {
  const nav = await getEnrichedNavigation();
  for (const cat of nav.categories) {
    for (const item of cat.items) {
      if (item.slug === slug) return `/${cat.categoryId}/${slug}`;
    }
  }
  return `/${slug}`; // fallback for uncategorized pages
}
