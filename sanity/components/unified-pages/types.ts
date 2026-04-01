// sanity/components/unified-pages/types.ts

// Re-export the types we need from the pages tool
export type {
  SectionItem,
  SectionTypeName,
  ImageItem,
  PageDoc,
  CategoryGroup,
} from "../pages/types";
export {
  SECTION_TYPES,
  SECTION_TYPE_LABELS,
  SECTION_TYPE_META,
  shortId,
  pageUrl,
} from "../pages/types";

import type { I18nString, ImageField } from "../homepage/types";

// ── Raw Sanity navigation document shapes ──────────────────

export interface NavItemRaw {
  _key: string;
  _type?: string;
  pageRef: { _type?: string; _ref: string };
  hidden?: boolean;
}

export interface NavCategoryRaw {
  _key: string;
  _type?: string;
  categoryRef: { _type?: string; _ref: string };
  items: NavItemRaw[];
}

export interface NavigationDoc {
  _id: string;
  _type: "navigation";
  _rev?: string;
  categories: NavCategoryRaw[];
}

// ── Denormalized category document ─────────────────────────

export interface CategoryDoc {
  _id: string;
  _type: "category";
  label?: I18nString[];
  description?: I18nString[];
  heroImage?: ImageField;
}

// Re-export for convenience
export type { I18nString, ImageField };

// ── Navigation page (lightweight, for the left panel) ──────

export interface NavPageDoc {
  _id: string;
  _type: "page";
  title?: I18nString[];
  slug?: string;
  categoryRef?: { _ref: string };
  firstImage?: ImageField;
  description?: I18nString[];
}

// ── Middle panel state ──────────────────────────────────────

export type MiddlePanelState =
  | null
  | { type: "page"; id: string }
  | { type: "category"; key: string }
  | { type: "createPage"; categoryKey: string }
  | { type: "createCategory" }
  | { type: "system"; name: "blog" | "announcements" };

// ── System page config ──────────────────────────────────────

export interface SystemPage {
  name: "blog" | "announcements";
  label: string;
  toolName: string;
  toolTitle: string;
}

export const SYSTEM_PAGES: SystemPage[] = [
  { name: "blog", label: "ブログ", toolName: "blog", toolTitle: "ブログ管理" },
  {
    name: "announcements",
    label: "お知らせ",
    toolName: "announcements",
    toolTitle: "お知らせ管理",
  },
];
