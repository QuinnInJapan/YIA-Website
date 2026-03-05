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

import type { I18nString, I18nBlocks } from "@/lib/i18n";

// ─── Atomic / Reusable Types ────────────────────────────────────────

export interface SanityImage {
  asset: { _ref: string };
  hotspot?: { x: number; y: number; width: number; height: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}

export interface SanityFile {
  asset: { _ref: string };
}

export interface InfoRow {
  label: I18nString;
  value: I18nString;
}

export interface Document {
  label: I18nString;
  file?: SanityFile;
  url?: string;
  type?: string;
}

export interface ImageFile {
  file: SanityImage;
  caption?: I18nString;
}

export interface EventFlyer {
  image?: SanityImage;
  imageJa?: SanityImage;
  imageEn?: SanityImage;
  alt?: string;
  altJa?: string;
  altEn?: string;
}

export interface LinkItem {
  title: I18nString;
  file?: SanityFile;
  url?: string;
  type?: "document" | "youtube" | "website";
  fileType?: string;
}

export interface Definition {
  term: I18nString;
  definition: I18nString;
}

export interface SisterCity {
  name: I18nString;
  country: string;
  countryJa?: string;
  image?: SanityImage;
  note?: string;
}

export interface GroupScheduleRow {
  name: I18nString;
  day: string;
  time: string;
  location: string;
  timeSlot?: "morning" | "afternoon" | "evening" | "weekend";
  schedulePdf?: SanityFile;
  photosPdf?: SanityFile;
  website?: string;
}

export interface ScheduleDateEntry {
  date: string;
  time?: string;
  location?: I18nString;
  description?: I18nString;
}

export interface BoardMember {
  name: string;
  role: I18nString;
}

// ─── Section Types (page.sections[]) ────────────────────────────────

export interface WarningsSection {
  _type: "warnings";
  items: (I18nString | I18nBlocks)[];
}

export interface ContentSection {
  _type: "content";
  id?: string;
  title?: I18nString;
  description?: I18nString | I18nBlocks;
  infoTable?: InfoRow[];
  checklist?: { label: I18nString; note?: I18nString }[];
  documents?: Document[];
  note?: I18nString | I18nBlocks;
  images?: ImageFile[];
  schedule?: { city: string; period: string }[];
}

export interface InfoTableSection {
  _type: "infoTable";
  title: I18nString;
  rows: InfoRow[];
  appointmentNote?: I18nString;
  additionalLanguageNote?: I18nString;
  otherNotes?: I18nString;
}

export interface TableScheduleSection {
  _type: "tableSchedule";
  title: I18nString;
  columns?: string[];
  columnsEn?: string[];
  rows?: string[][] | string;
}

export interface GroupScheduleSection {
  _type: "groupSchedule";
  title: I18nString;
  columns?: string[];
  columnsEn?: string[];
  groups?: GroupScheduleRow[];
}

export interface EventScheduleSection {
  _type: "eventSchedule";
  title: I18nString;
  entries?: ScheduleDateEntry[];
  entry?: { date: string; time?: string };
  venue?: { location: I18nString };
}

export interface GallerySection {
  _type: "gallery";
  images: ImageFile[];
}

export interface SisterCitiesSection {
  _type: "sisterCities";
  title: I18nString;
  cities: SisterCity[];
}

export interface DefinitionsSection {
  _type: "definitions";
  title: I18nString;
  items: Definition[];
}

export interface LinksSection {
  _type: "links";
  title: I18nString;
  items: LinkItem[];
}

export interface HistorySection {
  _type: "history";
  title: I18nString;
  intro?: I18nString | I18nBlocks;
  columns?: string[];
  columnsEn?: string[];
  years?: { year: string; cuisines: string }[];
}

export interface FairTradeSection {
  _type: "fairTrade";
  title: I18nString;
  description?: I18nString | I18nBlocks;
  priceList?: { type: string; weight: string; price: string }[];
  delivery?: I18nString | I18nBlocks;
}

export interface FlyersSection {
  _type: "flyers";
  items: EventFlyer[];
}

export interface BoardMembersSection {
  _type: "boardMembers";
  title: I18nString;
  asOf?: string;
  members: BoardMember[];
}

export interface FeeTableSection {
  _type: "feeTable";
  title: I18nString;
  rows: { memberType: I18nString; fee: string }[];
}

export interface DirectoryListSection {
  _type: "directoryList";
  title: I18nString;
  entries: { nameJa: string; tel: string; url?: string }[];
}

export type PageSection =
  | WarningsSection
  | ContentSection
  | InfoTableSection
  | TableScheduleSection
  | GroupScheduleSection
  | EventScheduleSection
  | GallerySection
  | SisterCitiesSection
  | DefinitionsSection
  | LinksSection
  | HistorySection
  | FairTradeSection
  | FlyersSection
  | BoardMembersSection
  | FeeTableSection
  | DirectoryListSection;

// ─── Document Types (top-level keys in site-data.json) ─────────────

export interface SiteSettings {
  _type: "siteSettings";
  org: {
    designation: string;
    name: I18nString;
    abbreviation: string;
    founded: string;
    npoEstablished: string;
    lastUpdated: string;
    description: I18nString;
  };
  contact: {
    postalCode: string;
    address: I18nString;
    tel: string;
    fax: string;
    email: string;
    website: string;
    youtube?: string;
  };
  businessHours: I18nString;
  copyright: string;
  googleMapsEmbedUrl: string;
}

export interface Category {
  _type: "category";
  id: string;
  label: I18nString;
  heroImage?: SanityImage;
}

export interface Navigation {
  _type: "navigation";
  categories: {
    categoryRef: { _type: "reference"; _ref: string };
    items: {
      id: string;
      pageRef: { _type: "reference"; _ref: string };
      title: I18nString;
    }[];
  }[];
  orgLinks: {
    id: string;
    pageRef: { _type: "reference"; _ref: string };
    title: I18nString;
  }[];
}

export interface Announcement {
  _type: "announcement";
  id: string;
  date?: string;
  pinned?: boolean;
  title: I18nString;
  content: I18nString | I18nBlocks;
  documents?: Document[];
  image?: SanityImage;
}

export interface Sidebar {
  _type: "sidebar";
  accessMap: { image?: SanityImage; label: I18nString };
  youtubeLink: { url: string; label: I18nString };
  counselingImage?: SanityImage;
  memberRecruitment: {
    label: I18nString;
    url: string;
  };
  activityRequestForm?: Document;
  fairTrade?: { label: I18nString };
  resourceBoxes: ResourceBox[];
  documents: Document[];
}

export interface ResourceBox {
  id?: string;
  title: I18nString;
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
    image?: SanityImage;
    tagline: I18nString;
  };
  activityGrid: {
    images: SanityImage[];
    stat: {
      value: number;
      label: I18nString;
    };
  };
  announcementRefs: { _type: "reference"; _ref: string }[];
  eventFlyers?: EventFlyer[];
}

export interface Page {
  _type: "page";
  id: string;
  slug: string;
  template?: string;
  category?: "shien" | "kehatsu" | "kouryu" | "kokusaikoken";
  title: I18nString;
  subtitle?: I18nString;
  description?: I18nString | I18nBlocks;
  images?: ImageFile[];
  sections: PageSection[];
}

// ─── Top-Level Site Data ────────────────────────────────────────────

export interface SiteData {
  site: SiteSettings;
  categories: Category[];
  navigation: Navigation;
  announcements: Announcement[];
  sidebar: Sidebar;
  homepage: Homepage;
  pages: Page[];
}
