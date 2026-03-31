export interface ImageField {
  _type?: string;
  _key?: string;
  asset?: { _ref: string; _type?: string };
  hotspot?: { x: number; y: number; width: number; height: number; _type?: string };
  crop?: { top: number; bottom: number; left: number; right: number; _type?: string };
}

export interface I18nString {
  _key: string;
  value: string;
}

export interface HomepageData {
  _id: string;
  _type: string;
  _rev?: string;
  hero?: {
    image?: ImageField;
    tagline?: I18nString[];
  };
  activityGrid?: {
    images?: ImageField[];
    stat?: {
      value?: number;
      label?: I18nString[];
    };
  };
  [key: string]: unknown;
}

export interface HomepageAboutData {
  _id: string;
  _type: string;
  _rev?: string;
  titleJa?: string;
  titleEn?: string;
  image?: ImageField;
  imageAlt?: I18nString[];
  bodyJa?: string;
  bodyEn?: string;
  [key: string]: unknown;
}

export interface SiteSettingsData {
  _id: string;
  _type: string;
  _rev?: string;
  org?: {
    name?: I18nString[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface CategoryData {
  _id: string;
  _type: string;
  _rev?: string;
  label?: I18nString[];
  description?: I18nString[];
  heroImage?: ImageField;
  [key: string]: unknown;
}

export interface NavItemData {
  title?: I18nString[];
  slug?: string;
}

export interface NavCategoryData {
  categoryId: string;
  items: NavItemData[];
}

export interface AnnouncementPreviewData {
  _id: string;
  title?: I18nString[];
  date?: string;
  slug?: string;
  pinned?: boolean;
}

export interface DocumentLinkItem {
  _key: string;
  label?: I18nString[];
  url?: string;
  file?: { asset?: { _ref: string } };
  type?: string;
  fileType?: string;
}

export interface SidebarData {
  _id: string;
  _type: string;
  _rev?: string;
  documents?: DocumentLinkItem[];
  [key: string]: unknown;
}

export interface HomepageFeaturedSlotData {
  categoryRef?: { _type?: string; _ref: string };
  pages?: { _type?: string; _ref: string; _key?: string }[];
}

export interface HomepageFeaturedData {
  _id: string;
  _type: string;
  _rev?: string;
  slot1?: HomepageFeaturedSlotData;
  slot2?: HomepageFeaturedSlotData;
  slot3?: HomepageFeaturedSlotData;
  slot4?: HomepageFeaturedSlotData;
  [key: string]: unknown;
}

export interface PageData {
  _id: string;
  title?: I18nString[];
  slug?: string;
}

export type DocType =
  | "homepage"
  | "homepageAbout"
  | "homepageFeatured"
  | "siteSettings"
  | "sidebar"
  | "category";

export type UpdateFieldFn = (
  docType: DocType,
  docId: string,
  field: string,
  value: unknown,
) => void;

export type OpenPickerFn = (onSelect: (assetId: string) => void) => void;

export type ShowHotspotCropFn = (
  imageUrl: string,
  value: { hotspot: any; crop: any },
  onChange: (v: { hotspot: any; crop: any }) => void,
) => void;
