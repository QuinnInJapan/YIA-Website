/**
 * YIA Site Data Schema (CMS-Ready)
 *
 * Canonical type definitions for site-data.json.
 * Each top-level key maps to a Sanity document type.
 * Each sections[] _type maps to a Sanity object type.
 *
 * Usage: reference only (not executed). Keep in sync with site-data.json
 * and the renderers in build.js.
 */

// ─── Atomic / Reusable Types ────────────────────────────────────────

export interface BilingualText {
  ja: string;
  en: string;
}

export interface InfoRow {
  labelJa: string;
  labelEn?: string;
  valueJa: string;
  valueEn?: string;
}

export interface Document {
  label: string;
  labelEn?: string;
  url: string;
  type?: string;
}

export interface ImageFile {
  file: string;
  captionJa?: string;
  captionEn?: string;
}

export interface EventFlyer {
  image?: string;
  imageJa?: string;
  imageEn?: string;
  alt?: string;
  altJa?: string;
  altEn?: string;
}

export interface ResourceLink {
  type: "youtube";
  url: string;
  titleJa: string;
  titleEn?: string;
}

export interface Definition {
  termJa: string;
  termEn?: string;
  definitionJa: string;
  definitionEn?: string;
}

export interface SisterCity {
  nameJa: string;
  nameEn: string;
  country: string;
  countryJa?: string;
  image?: string;
  note?: string;
}

export interface GroupScheduleRow {
  name: string;
  nameEn?: string;
  day: string;
  time: string;
  location: string;
  timeSlot?: "morning" | "afternoon" | "evening" | "weekend";
  schedule_pdf?: string;
  photos_pdf?: string;
  website?: string;
}

export interface ScheduleDateEntry {
  date: string;
  time?: string;
  locationJa?: string;
  locationEn?: string;
  descriptionJa?: string;
  descriptionEn?: string;
}

export interface BoardMember {
  name: string;
  roleJa: string;
  roleEn: string;
}

// ─── Section Types (page.sections[]) ────────────────────────────────

export interface WarningsSection {
  _type: "warnings";
  items: BilingualText[];
}

export interface ContentSection {
  _type: "content";
  id?: string;
  titleJa: string;
  titleEn?: string;
  descriptionJa?: string;
  descriptionEn?: string;
  infoTable?: InfoRow[];
  checklist?: { labelJa: string; labelEn?: string; noteJa?: string; noteEn?: string }[];
  documents?: Document[];
  noteJa?: string;
  noteEn?: string;
  images?: ImageFile[];
  schedule?: { city: string; period: string }[];
}

export interface InfoTableSection {
  _type: "infoTable";
  titleJa: string;
  titleEn: string;
  rows: InfoRow[];
  appointmentNote?: BilingualText;
  additionalLanguageNote?: BilingualText;
  otherNotes?: BilingualText;
}

export interface OtherNotesSection {
  _type: "otherNotes";
  ja: string;
  en: string;
}

export interface ScheduleSection {
  _type: "schedule";
  titleJa: string;
  titleEn: string;
  subtype?: "dated";
  // Regular schedule fields (weekly/group/event)
  type?: "weekly" | "group" | "event";
  columns?: string[];
  columnsEn?: string[];
  rows?: string[][] | GroupScheduleRow[];
  // Dated schedule fields
  entries?: ScheduleDateEntry[];
  entry?: { date: string; time?: string };
  venue?: { locationJa: string; locationEn?: string };
}

export interface GallerySection {
  _type: "gallery";
  images: ImageFile[];
}

export interface SisterCitiesSection {
  _type: "sisterCities";
  titleJa: string;
  titleEn: string;
  cities: SisterCity[];
}

export interface DefinitionsSection {
  _type: "definitions";
  titleJa: string;
  titleEn: string;
  items: Definition[];
}

export interface ResourcesSection {
  _type: "resources";
  titleJa: string;
  titleEn: string;
  items: ResourceLink[];
}

export interface HistorySection {
  _type: "history";
  titleJa: string;
  titleEn: string;
  introJa?: string;
  introEn?: string;
  columns?: string[];
  columnsEn?: string[];
  years?: { year: string; cuisines: string }[];
}

export interface FairTradeSection {
  _type: "fairTrade";
  titleJa: string;
  titleEn: string;
  descriptionJa?: string;
  descriptionEn?: string;
  priceList?: { type: string; weight: string; price: string }[];
  deliveryJa?: string;
  deliveryEn?: string;
}

export interface FlyersSection {
  _type: "flyers";
  items: EventFlyer[];
}

export interface DocumentsSection {
  _type: "documents";
  titleJa: string;
  titleEn: string;
  items: Document[];
}

export interface BoardMembersSection {
  _type: "boardMembers";
  titleJa: string;
  titleEn: string;
  asOf?: string;
  members: BoardMember[];
}

export interface FeeTableSection {
  _type: "feeTable";
  titleJa: string;
  titleEn: string;
  rows: { typeJa: string; typeEn?: string; fee: string }[];
}

export interface DirectoryListSection {
  _type: "directoryList";
  titleJa: string;
  titleEn: string;
  entries: { nameJa: string; tel: string; url?: string }[];
}

export type PageSection =
  | WarningsSection
  | ContentSection
  | InfoTableSection
  | OtherNotesSection
  | ScheduleSection
  | GallerySection
  | SisterCitiesSection
  | DefinitionsSection
  | ResourcesSection
  | HistorySection
  | FairTradeSection
  | FlyersSection
  | DocumentsSection
  | BoardMembersSection
  | FeeTableSection
  | DirectoryListSection;

// ─── Document Types (top-level keys in site-data.json) ─────────────

export interface SiteSettings {
  _type: "siteSettings";
  org: {
    designation: string;
    nameJa: string;
    nameEn: string;
    abbreviation: string;
    founded: string;
    npoEstablished: string;
    lastUpdated: string;
    descriptionJa: string;
    descriptionEn: string;
  };
  contact: {
    postalCode: string;
    addressJa: string;
    addressEn: string;
    tel: string;
    fax: string;
    email: string;
    website: string;
    youtube?: string;
  };
  businessHours: BilingualText;
  copyright: string;
  googleMapsEmbedUrl: string;
}

export interface Category {
  _type: "category";
  id: string;
  labelJa: string;
  labelEn: string;
  heroImage: string;
}

export interface Navigation {
  _type: "navigation";
  categories: {
    categoryId: string;
    items: {
      id: string;
      pageRef: string;
      titleJa: string;
      titleEasy?: string;
      titleEn: string;
    }[];
  }[];
  orgLinks: {
    id: string;
    pageRef: string;
    titleJa: string;
    titleEn: string;
  }[];
}

export interface Announcement {
  _type: "announcement";
  id: string;
  date?: string;
  urgent?: boolean;
  titleJa: string;
  titleEn?: string;
  contentJa: string;
  contentEn: string;
  documents?: Document[];
  image?: string;
}

export interface GlobalResources {
  _type: "globalResources";
  accessMap: { image: string; labelJa: string; labelEn?: string };
  youtubeLink: { url: string; labelJa: string; labelEn?: string };
  counselingImage?: string;
  memberRecruitment: {
    labelJa: string;
    labelEasy?: string;
    labelEn?: string;
    url: string;
  };
  activityRequestForm?: Document;
  fairTrade?: { labelJa: string; labelEn?: string };
  resourceBoxes: ResourceBox[];
  documents: Document[];
}

export interface ResourceBox {
  id?: string;
  titleJa: string;
  titleEasy?: string;
  titleEn?: string;
  url?: string;
  attribution?: string;
  links: {
    lang: string;
    label: string;
    labelEasy?: string;
    subtitle?: string;
    url?: string;
  }[];
}

export interface Homepage {
  _type: "homepage";
  slug: string;
  template?: string;
  hero: {
    image: string;
    taglineJa: string;
    taglineEn: string;
  };
  activityGrid: {
    images: string[];
    stat: {
      value: number;
      labelJa: string;
      labelEn: string;
    };
  };
  announcementIds: string[];
  eventFlyers?: EventFlyer[];
}

export interface Page {
  _type: "page";
  id: string;
  slug: string;
  template?: string;
  category?: "shien" | "kehatsu" | "kouryu" | "kokusaikoken";
  titleJa: string;
  titleEn?: string;
  titleEasy?: string;
  subtitleJa?: string;
  subtitleEn?: string;
  descriptionJa?: string;
  descriptionEn?: string;
  descriptionEasy?: string;
  images?: ImageFile[];
  sections: PageSection[];
}

// ─── Top-Level Site Data ────────────────────────────────────────────

export interface SiteData {
  site: SiteSettings;
  categories: Category[];
  navigation: Navigation;
  announcements: Announcement[];
  globalResources: GlobalResources;
  homepage: Homepage;
  pages: Page[];
}

// ─── Renderer Coverage Map ──────────────────────────────────────────
//
// Section _type          → Renderer function          → CSS Component
// ──────────────────────────────────────────────────────────────────
// warnings               → sectionRenderers.warnings   → .callout--warning
// content                → sectionRenderers.content     → .page-section
// infoTable              → sectionRenderers.infoTable   → .info-dl
// otherNotes             → sectionRenderers.otherNotes  → .bilingual-block
// schedule               → sectionRenderers.schedule    → .schedule-table / .info-dl
// gallery                → sectionRenderers.gallery     → .photo-gallery
// sisterCities           → sectionRenderers.sisterCities → .sister-city-showcase
// definitions            → sectionRenderers.definitions → .definition-card
// resources              → sectionRenderers.resources   → .resource-link
// history                → sectionRenderers.history     → .bilingual-block + .schedule-table
// fairTrade              → sectionRenderers.fairTrade   → .bilingual-block + .schedule-table + .info-dl
// flyers                 → sectionRenderers.flyers      → .event-flyer-pair
// documents              → sectionRenderers.documents   → .doc-list
// boardMembers           → sectionRenderers.boardMembers → .board-grid
// feeTable               → sectionRenderers.feeTable   → .fee-table
// directoryList          → sectionRenderers.directoryList → .directory-list
