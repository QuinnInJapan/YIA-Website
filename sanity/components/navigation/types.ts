import type { I18nString, ImageField } from "../homepage/types";

// ── Raw Sanity document shapes ──────────────────────

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

// ── Denormalized data for UI ────────────────────────

export interface CategoryDoc {
  _id: string;
  _type: "category";
  label?: I18nString[];
  description?: I18nString[];
  heroImage?: ImageField;
}

export interface PageDoc {
  _id: string;
  _type: "page";
  title?: I18nString[];
  slug?: string;
  categoryRef?: { _ref: string };
  coverImage?: ImageField;
}

// ── Right panel state machine ───────────────────────

export type RightPanelState =
  | null
  | { type: "editCategory"; categoryKey: string }
  | { type: "addPage"; categoryKey: string }
  | { type: "addCategory" }
  | { type: "renameCategory"; categoryKey: string }
  | { type: "changeHeroImage"; categoryKey: string };

// ── Callback types ──────────────────────────────────

export type OnOpenRightPanel = (panel: RightPanelState) => void;
