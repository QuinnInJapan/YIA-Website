import type {
  SiteData,
  ProgramPage,
  Announcement,
  Category,
} from "./types";
import { withBasePath } from "./basePath";
import siteDataJson from "@/data/site-data.json";

// Cast the imported JSON to our typed interface
const siteData = siteDataJson as unknown as SiteData;

export function getSiteData(): SiteData {
  return siteData;
}

// ── Category index ──────────────────────────────────────────────

const categoryIndex: Record<string, Category> = {};
for (const cat of siteData.categories) {
  categoryIndex[cat.id] = cat;
}

export function getCategoryIndex(): Record<string, Category> {
  return categoryIndex;
}

// ── Navigation enrichment ───────────────────────────────────────
// Enriches navigation categories with label/heroImage from top-level categories
// and resolves pageRef → URL for nav items.
// In Next.js, links are /slug instead of slug.html.

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

let enrichedNav: EnrichedNavigation | null = null;

export function getEnrichedNavigation(): EnrichedNavigation {
  if (enrichedNav) return enrichedNav;

  const categories: EnrichedNavCategory[] = siteData.navigation.categories.map(
    (navCat) => {
      const cat = categoryIndex[navCat.categoryId];
      return {
        categoryId: navCat.categoryId,
        id: cat?.id ?? navCat.categoryId,
        labelJa: cat?.labelJa ?? "",
        labelEn: cat?.labelEn ?? "",
        heroImage: cat?.heroImage ?? "",
        items: navCat.items.map((item) => ({
          ...item,
          url: item.pageRef ? withBasePath(`/${item.pageRef}`) : "",
        })),
      };
    }
  );

  const orgLinks: EnrichedNavItem[] = siteData.navigation.orgLinks.map(
    (link) => ({
      ...link,
      url: link.pageRef ? withBasePath(`/${link.pageRef}`) : "",
    })
  );

  enrichedNav = { categories, orgLinks };
  return enrichedNav;
}

// ── Program pages ───────────────────────────────────────────────

const programPageIndex: Record<string, ProgramPage> = {};
for (const pg of siteData.programPages) {
  programPageIndex[pg.id] = pg;
}

export function getProgramPage(slug: string): ProgramPage | undefined {
  return programPageIndex[slug];
}

export function getAllProgramSlugs(): string[] {
  return siteData.programPages.map((pg) => pg.slug);
}

export function getAllProgramPages(): ProgramPage[] {
  return siteData.programPages;
}

// ── Announcements ───────────────────────────────────────────────

const announcementIndex: Record<string, Announcement> = {};
for (const a of siteData.announcements) {
  announcementIndex[a.id] = a;
}

export function getAnnouncementsByIds(ids: string[]): Announcement[] {
  return ids.map((id) => announcementIndex[id]).filter(Boolean);
}
