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

export interface TocEntry {
  id: string;
  text: string;
  subtext?: string;
}

export interface BilingualCell {
  ja: string;
  en: string;
}

export interface InfoRow {
  label: I18nString;
  value: I18nString;
}

export interface Document {
  label: I18nString;
  file?: SanityFile;
  url?: string;
  type?: "document" | "youtube" | "website" | string;
  fileType?: string;
}

export interface ImageFile {
  file: SanityImage;
  caption?: I18nString;
}

export interface Definition {
  term: I18nString;
  definition: I18nString;
}

export interface SisterCity {
  name: I18nString;
  country: I18nString;
  image?: SanityImage;
  note?: string;
}

// ─── Section Types (page.sections[]) ────────────────────────────────

export interface WarningsSection {
  _type: "warnings";
  items: { _key: string; value: I18nString }[];
}

export interface TableColumn {
  _key: string;
  label: I18nString;
  type?: "text" | "date" | "phone" | "url" | "currency" | "name";
}

export interface TableRow {
  _key: string;
  groupLabel?: I18nString;
  cells: I18nString[];
}

export interface TableSection {
  _type: "table";
  title?: I18nString;
  hideTitle?: boolean;
  caption?: I18nString;
  columns: TableColumn[];
  rows: TableRow[];
}

export interface LabelTableSection {
  _type: "labelTable";
  title?: I18nString;
  hideTitle?: boolean;
  rows: InfoRow[];
}

export interface InfoCardsSection {
  _type: "infoCards";
  title?: I18nString;
  hideTitle?: boolean;
  items: Definition[];
}

export interface ImageCardsSection {
  _type: "imageCards";
  title?: I18nString;
  hideTitle?: boolean;
  items: SisterCity[];
}

export interface ContentSection {
  _type: "content";
  id?: string;
  title?: I18nString;
  description?: I18nString;
}

export interface GallerySection {
  _type: "gallery";
  images: ImageFile[];
}

export interface LinksSection {
  _type: "links";
  title: I18nString;
  items: Document[];
}

type PageSectionShape =
  | WarningsSection
  | ContentSection
  | GallerySection
  | LinksSection
  | TableSection
  | LabelTableSection
  | InfoCardsSection
  | ImageCardsSection;

export type PageSection = PageSectionShape & { _key: string };

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
  _id: string;
  label: I18nString;
  description?: I18nString;
  heroImage: SanityImage;
}

export interface Navigation {
  _type: "navigation";
  categories: {
    categoryRef: Category;
    items: {
      pageRef: Page;
      hidden?: boolean;
    }[];
  }[];
}

export interface HomepageFeatured {
  _type: "homepageFeatured";
  categories: Category[];
}

export interface Announcement {
  _type: "announcement";
  _id: string;
  slug?: string;
  date?: string;
  pinned?: boolean;
  title: I18nString;
  heroImage?: SanityImage & { alt?: I18nString };
  excerpt?: I18nString;
  body: I18nBlocks;
  documents?: Document[];
  /** @deprecated Use body */
  content?: I18nString | I18nBlocks;
  /** @deprecated Use heroImage */
  image?: SanityImage;
}

export interface Sidebar {
  _type: "sidebar";
  documents: Document[];
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
  announcementRefs: Announcement[];
}

export interface Page {
  _type: "page";
  _id: string;
  slug: string;
  template?: string;
  categoryRef?: { _ref: string };
  title: I18nString;
  subtitle?: I18nString;
  description?: I18nString;
  images?: ImageFile[];
  sections: PageSection[];
}

// ─── Blog ───────────────────────────────────────────────────────────

export interface BlogPost {
  _type: "blogPost";
  _id: string;
  title: I18nString;
  slug: string;
  author?: string;
  publishedAt: string;
  category?: I18nString;
  heroImage?: SanityImage & { alt?: I18nString };
  excerpt?: I18nString;
  body: I18nBlocks;
  relatedPosts?: BlogPost[];
  documents?: Document[];
}

// ─── Top-Level Site Data ────────────────────────────────────────────

export interface SiteData {
  site: SiteSettings;
  categories: Category[];
  navigation: Navigation;
  announcements: Announcement[];
  sidebar: Sidebar;
  homepage: Homepage;
  homepageFeatured: HomepageFeatured;
  pages: Page[];
}
