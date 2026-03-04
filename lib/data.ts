import { cache } from "react";
import type {
  SiteData,
  ProgramPage,
  Announcement,
  Category,
} from "./types";
import {
  fetchSiteData,
  fetchProgramPageBySlug,
  fetchAllProgramSlugs as _fetchAllProgramSlugs,
  fetchAnnouncements,
} from "./sanity/queries";

// Empty defaults for when Sanity has no data yet
const emptySiteData: SiteData = {
  site: { _type: "siteSettings", org: { designation: "", nameJa: "", nameEn: "", abbreviation: "", founded: "", npoEstablished: "", lastUpdated: "", descriptionJa: "", descriptionEn: "" }, contact: { postalCode: "", addressJa: "", addressEn: "", tel: "", fax: "", email: "", website: "" }, businessHours: { ja: "", en: "" }, copyright: "", googleMapsEmbedUrl: "" },
  categories: [],
  navigation: { _type: "navigation", categories: [], orgLinks: [] },
  announcements: [],
  globalResources: { _type: "globalResources", accessMap: { image: "", labelJa: "", labelEn: "" }, youtubeLink: { url: "", labelJa: "", labelEn: "" }, memberRecruitment: { labelJa: "", url: "" }, resourceBoxes: [], documents: [] },
  homepage: { _type: "homepage", slug: "", hero: { image: "", taglineJa: "", taglineEn: "" }, activityGrid: { images: [], stat: { value: 0, labelJa: "", labelEn: "" } }, announcementIds: [] },
  aboutPage: { _type: "aboutPage", slug: "aboutyia", template: "organization-overview", titleJa: "", missionJa: "", orgDetails: { founded: "", npoEstablished: "", members: "" } },
  membershipPage: { _type: "membershipPage", slug: "kaiinn", template: "membership", titleJa: "", feeTable: [] },
  directoryPage: { _type: "directoryPage", slug: "directory", template: "directory", titleJa: "", entries: [] },
  programPages: [],
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
    programPages: raw.programPages || [],
    navigation: raw.navigation || emptySiteData.navigation,
    globalResources: raw.globalResources || emptySiteData.globalResources,
    homepage: raw.homepage || emptySiteData.homepage,
    aboutPage: raw.aboutPage || emptySiteData.aboutPage,
    membershipPage: raw.membershipPage || emptySiteData.membershipPage,
    directoryPage: raw.directoryPage || emptySiteData.directoryPage,
  } as SiteData;
});

// ── Category index ──────────────────────────────────────────────

export async function getCategoryIndex(): Promise<Record<string, Category>> {
  const data = await getSiteData();
  const index: Record<string, Category> = {};
  for (const cat of data.categories) {
    index[cat.id] = cat;
  }
  return index;
}

// ── Navigation enrichment ───────────────────────────────────────

interface EnrichedNavItem {
  id: string;
  pageRef?: string;
  titleJa: string;
  titleEasy?: string;
  titleEn: string;
  url: string;
}

interface EnrichedNavCategory {
  categoryId: string;
  id: string;
  labelJa: string;
  labelEn: string;
  heroImage: string;
  items: EnrichedNavItem[];
}

interface EnrichedNavigation {
  categories: EnrichedNavCategory[];
  orgLinks: EnrichedNavItem[];
}

export const getEnrichedNavigation = cache(
  async (): Promise<EnrichedNavigation> => {
    const data = await getSiteData();
    const categoryIndex: Record<string, Category> = {};
    for (const cat of data.categories) {
      categoryIndex[cat.id] = cat;
    }

    const categories: EnrichedNavCategory[] =
      data.navigation.categories.map((navCat) => {
        const cat = categoryIndex[navCat.categoryId];
        return {
          categoryId: navCat.categoryId,
          id: cat?.id ?? navCat.categoryId,
          labelJa: cat?.labelJa ?? "",
          labelEn: cat?.labelEn ?? "",
          heroImage: cat?.heroImage ?? "",
          items: navCat.items.map((item) => ({
            ...item,
            url: item.pageRef ? `/${item.pageRef}` : "",
          })),
        };
      });

    const orgLinks: EnrichedNavItem[] = data.navigation.orgLinks.map(
      (link) => ({
        ...link,
        url: link.pageRef ? `/${link.pageRef}` : "",
      })
    );

    return { categories, orgLinks };
  }
);

// ── Program pages ───────────────────────────────────────────────

export async function getProgramPage(
  slug: string
): Promise<ProgramPage | undefined> {
  const data = await getSiteData();
  return data.programPages.find((pg) => pg.id === slug || pg.slug === slug);
}

export async function getAllProgramSlugs(): Promise<string[]> {
  const data = await getSiteData();
  return data.programPages.map((pg) => pg.slug);
}

export async function getAllProgramPages(): Promise<ProgramPage[]> {
  const data = await getSiteData();
  return data.programPages;
}

// ── Announcements ───────────────────────────────────────────────

export async function getAnnouncementsByIds(
  ids: string[]
): Promise<Announcement[]> {
  const data = await getSiteData();
  const index: Record<string, Announcement> = {};
  for (const a of data.announcements) {
    index[a.id] = a;
  }
  return ids.map((id) => index[id]).filter(Boolean);
}
