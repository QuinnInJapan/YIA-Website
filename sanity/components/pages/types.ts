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

// Metadata for section picker UI
export const SECTION_TYPE_META: Record<
  SectionTypeName,
  { description: string; category: "common" | "oneoff" }
> = {
  content: { description: "テキストコンテンツを表示", category: "common" },
  infoTable: { description: "ラベルと値のペアで情報を整理", category: "common" },
  links: { description: "資料やリンクの一覧", category: "common" },
  warnings: { description: "注意書きや警告メッセージ", category: "common" },
  gallery: { description: "写真をグリッドで表示", category: "common" },
  flyers: { description: "イベントチラシを並べて表示", category: "common" },
  eventSchedule: { description: "イベントの日程表", category: "common" },
  groupSchedule: { description: "グループ別のスケジュール", category: "common" },
  tableSchedule: { description: "表形式のスケジュール", category: "common" },
  definitions: { description: "用語と定義のカード", category: "common" },
  feeTable: { description: "料金や会費の一覧表", category: "common" },
  directoryList: { description: "連絡先や施設の一覧", category: "common" },
  boardMembers: { description: "役員の名前と役職", category: "oneoff" },
  fairTrade: { description: "フェアトレード紹介", category: "oneoff" },
  sisterCities: { description: "姉妹都市のカード", category: "oneoff" },
  history: { description: "年表形式の沿革", category: "oneoff" },
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
