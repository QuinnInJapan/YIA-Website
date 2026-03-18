// Section type names matching the schema definitions
export const SECTION_TYPES = [
  "content",
  "infoTable",
  "links",
  "warnings",
  "gallery",
  "flyers",
  "eventSchedule",
  "groupSchedule",
  "tableSchedule",
  "definitions",
  "feeTable",
  "directoryList",
  "boardMembers",
  "fairTrade",
  "sisterCities",
  "history",
] as const;

export type SectionTypeName = (typeof SECTION_TYPES)[number];

// Human-readable labels for each section type
export const SECTION_TYPE_LABELS: Record<SectionTypeName, string> = {
  content: "コンテンツ",
  infoTable: "情報テーブル",
  links: "リンク",
  warnings: "注意事項",
  gallery: "ギャラリー",
  flyers: "チラシ",
  eventSchedule: "イベントスケジュール",
  groupSchedule: "グループスケジュール",
  tableSchedule: "テーブルスケジュール",
  definitions: "用語集",
  feeTable: "料金表",
  directoryList: "連絡先一覧",
  boardMembers: "役員一覧",
  fairTrade: "フェアトレード",
  sisterCities: "姉妹都市",
  history: "沿革",
};

// A section item as stored in Sanity (generic shape)
export interface SectionItem {
  _key: string;
  _type: SectionTypeName;
  title?: { _key: string; value: string }[] | null;
  hideTitle?: boolean;
  [key: string]: unknown;
}

// Page document shape
export interface PageDoc {
  _id: string;
  _rev?: string;
  _updatedAt?: string;
  title: { _key: string; value: string }[] | null;
  subtitle: { _key: string; value: string }[] | null;
  description: { _key: string; value: string }[] | null;
  slug: string | null;
  template: string | null;
  categoryRef: { _ref: string } | null;
  images: ImageItem[] | null;
  sections: SectionItem[] | null;
}

export interface ImageItem {
  _key: string;
  _type: "imageFile";
  file?: {
    asset?: { _ref: string };
    hotspot?: { x: number; y: number; width: number; height: number };
    crop?: { top: number; bottom: number; left: number; right: number };
  };
  caption?: { _key: string; value: string }[];
}

// Sidebar category group (fetched from navigation document)
export interface CategoryGroup {
  _key: string;
  categoryId: string;
  categoryLabel: string;
  pages: { _key: string; pageId: string; titleJa: string; slug: string; hasDraft: boolean }[];
}

/** Strip the type prefix from a Sanity _id (e.g. "category-support" → "support") */
export function shortId(docId: string): string {
  const dash = docId.indexOf("-");
  return dash >= 0 ? docId.slice(dash + 1) : docId;
}

/** Build the frontend URL path for a page given its category _id and slug */
export function pageUrl(categoryId: string, slug: string): string {
  return `/${shortId(categoryId)}/${slug}`;
}
