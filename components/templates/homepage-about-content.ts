export interface HomepageAboutContentSource {
  titleJa?: string | null;
  titleEn?: string | null;
  bodyJa?: string | null;
  bodyEn?: string | null;
}

export const DEFAULT_HOMEPAGE_ABOUT_CONTENT = {
  titleJa: "YIAについて",
  titleEn: "About YIA",
  bodyJa:
    "横須賀国際交流協会（YIA）は、横須賀市における多文化共生社会の実現を目指し、国際交流・国際協力・在住外国人支援の三つの柱で活動しています。日本語教室、文化交流イベント、生活相談など、地域に根ざした多様なプログラムを通じて、すべての人が安心して暮らせるまちづくりに貢献しています。",
  bodyEn:
    "The Yokosuka International Association (YIA) works toward a multicultural society in Yokosuka through international exchange, cooperation, and support for foreign residents. From Japanese language classes and cultural events to daily-life consultations, our community-rooted programs help everyone feel at home.",
} as const;

function nonBlank(value: string | null | undefined, fallback: string): string {
  return value?.trim() ? value : fallback;
}

export function resolveHomepageAboutContent(about: HomepageAboutContentSource | null | undefined) {
  return {
    titleJa: nonBlank(about?.titleJa, DEFAULT_HOMEPAGE_ABOUT_CONTENT.titleJa),
    titleEn: nonBlank(about?.titleEn, DEFAULT_HOMEPAGE_ABOUT_CONTENT.titleEn),
    bodyJa: nonBlank(about?.bodyJa, DEFAULT_HOMEPAGE_ABOUT_CONTENT.bodyJa),
    bodyEn: nonBlank(about?.bodyEn, DEFAULT_HOMEPAGE_ABOUT_CONTENT.bodyEn),
  };
}
