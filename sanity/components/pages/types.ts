// Section type names matching the schema definitions
export const SECTION_TYPES = [
  "content",
  "links",
  "warnings",
  "gallery",
  "table",
  "labelTable",
  "infoCards",
  "imageCards",
] as const;

export type SectionTypeName = (typeof SECTION_TYPES)[number];

// Human-readable labels for each section type
export const SECTION_TYPE_LABELS: Record<SectionTypeName, string> = {
  content: "コンテンツ",
  links: "リンク",
  warnings: "注意事項",
  gallery: "ギャラリー",
  table: "テーブル",
  labelTable: "ラベルテーブル",
  infoCards: "情報カード",
  imageCards: "画像カード",
};

// Metadata for section picker UI
export const SECTION_TYPE_META: Record<
  SectionTypeName,
  { description: string; category: "common" | "oneoff" }
> = {
  content: { description: "テキストコンテンツを表示", category: "common" },
  links: { description: "資料やリンクの一覧", category: "common" },
  warnings: { description: "注意書きや警告メッセージ", category: "common" },
  gallery: { description: "写真をグリッドで表示", category: "common" },
  table: { description: "カラムと行のデータテーブル", category: "common" },
  labelTable: { description: "ラベルと値のペアで情報を整理", category: "common" },
  infoCards: { description: "用語と定義のカード", category: "common" },
  imageCards: { description: "画像付きカードの一覧", category: "common" },
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
