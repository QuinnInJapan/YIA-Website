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
