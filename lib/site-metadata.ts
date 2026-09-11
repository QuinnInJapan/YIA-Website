import type { Metadata } from "next";

export const SITE_NAME = "横須賀国際交流協会";
export const SITE_URL = "https://yia.jp";
export const DEFAULT_SITE_DESCRIPTION =
  "横須賀の多文化共生を支える国際交流の拠点。生活相談、日本語教室、文化交流、防災支援など幅広い活動を行っています。";
export const SOCIAL_IMAGE_ALT = "横須賀国際交流協会の活動風景と団体名";

const SOCIAL_IMAGE = {
  url: "/opengraph-image",
  secureUrl: `${SITE_URL}/opengraph-image`,
  width: 1200,
  height: 630,
  type: "image/png",
  alt: SOCIAL_IMAGE_ALT,
};

// Search/browser/share metadata only; visible page titles and descriptions stay in Sanity.
const SEARCH_TITLES: Record<string, string> = {
  "/": "日本語教室・生活相談・国際交流",
  "/classes/conversation-salon": "横須賀の日本語教室・日本語会話サロン",
  "/classes/foreign-languages": "横須賀の英会話・韓国語・中国語講座",
  "/services/counseling": "横須賀の外国人生活相談・多言語相談",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "/classes":
    "横須賀国際交流協会の教室・講座をご案内します。日本語会話サロン、英会話・韓国語・中国語の外国語講座、国際理解講座などの開催情報や申込方法をご確認いただけます。",
  "/events":
    "横須賀国際交流協会の国際交流イベントをご案内します。日本文化体験教室、ジャパンフェスティバル、キッズフェスティバル、国際ユースフォーラムの開催情報をご確認いただけます。",
  "/services":
    "横須賀国際交流協会の相談・サービスをご案内します。外国人のための多言語による生活相談、翻訳・通訳、防災支援の利用方法をご確認いただけます。",
  "/partnerships":
    "横須賀国際交流協会の交流・協力事業をご案内します。ホームステイ・ホームビジット、フェアトレード、姉妹都市交換学生の情報をご確認いただけます。",
  "/about":
    "横須賀国際交流協会（YIA）の概要、活動、あゆみをご紹介します。会員募集や賛助会員についてもご案内しています。",
};

export function pageMetadata({
  title,
  description,
  pathname,
}: {
  title: string;
  description?: string;
  pathname: string;
}): Metadata {
  const searchTitle = SEARCH_TITLES[pathname] || title;
  const searchDescription =
    CATEGORY_DESCRIPTIONS[pathname] || description?.trim() || DEFAULT_SITE_DESCRIPTION;
  return {
    title: searchTitle,
    description: searchDescription,
    ...socialMetadata({ title: searchTitle, description: searchDescription, pathname }),
  };
}

/** Extract a Japanese summary from plain text, bilingual fields, or Portable Text. */
export function contentDescription(...fields: unknown[]): string | undefined {
  function plainText(value: unknown): string {
    if (typeof value === "string") return value;
    if (!Array.isArray(value)) return "";
    const japanese = value.find((item) => item?._key === "ja");
    if (japanese) return plainText(japanese.value);
    return value
      .filter((block) => block?._type === "block" && Array.isArray(block.children))
      .map((block) => block.children.map((span: { text?: string }) => span?.text || "").join(""))
      .join(" ");
  }
  for (const field of fields) {
    const text = plainText(field)
      .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (text) return [...text].slice(0, 160).join("");
  }
  return undefined;
}

export function socialMetadata({
  title,
  description = DEFAULT_SITE_DESCRIPTION,
  pathname,
}: {
  title: string;
  description?: string;
  pathname: string;
}): Pick<Metadata, "alternates" | "openGraph" | "twitter"> {
  const socialTitle = title === SITE_NAME ? SITE_NAME : `${title} — ${SITE_NAME}`;

  return {
    alternates: { canonical: pathname },
    openGraph: {
      type: "website",
      locale: "ja_JP",
      url: pathname,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [SOCIAL_IMAGE],
    },
  };
}
