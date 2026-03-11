import Image from "next/image";
import { Nl2br } from "@/lib/helpers";
import { imageUrl, hotspotPosition } from "@/lib/sanity/image";
import type { ImageFile } from "@/lib/types";
import type { I18nString } from "@/lib/i18n";
import { ja, en } from "@/lib/i18n";

interface PageHeroProps {
  titleJa: string;
  titleEn?: string;
  description?: I18nString;
  descriptionJa?: string;
  descriptionEn?: string;
  images?: ImageFile[];
}

export default function PageHero({
  titleJa,
  titleEn,
  description,
  descriptionJa,
  descriptionEn,
  images,
}: PageHeroProps) {
  const jaText = descriptionJa ?? (description ? ja(description) : "");
  const enText = descriptionEn ?? (description ? en(description) : "");

  const descHtml = jaText ? (
    <div className="page-hero__description">
      <p>
        <Nl2br text={jaText} />
      </p>
      {enText && (
        <p className="page-hero__description-en" lang="en" translate="no">
          <Nl2br text={enText} />
        </p>
      )}
    </div>
  ) : null;

  // Use first image as hero background if available
  const heroFile = images?.[0]?.file;
  const heroImg = heroFile ? imageUrl(heroFile) : "";
  const heroPosition = heroFile ? hotspotPosition(heroFile) : undefined;
  if (heroImg) {
    return (
      <div className="page-hero">
        <Image
          src={heroImg}
          alt=""
          fill
          sizes="100vw"
          className="page-hero__img"
          style={heroPosition ? { objectPosition: heroPosition } : undefined}
        />
        <h1 className="page-hero__title">{titleJa}</h1>
        <p className="page-hero__subtitle" lang="en" translate="no">{titleEn || ""}</p>
        {descHtml}
      </div>
    );
  }

  // Solid hero fallback
  return (
    <div className="page-hero page-hero--solid">
      <h1 className="page-hero__title">{titleJa}</h1>
      <p className="page-hero__subtitle" lang="en" translate="no">{titleEn || ""}</p>
      {descHtml}
    </div>
  );
}

export function SolidHero({
  titleJa,
  titleEn,
}: {
  titleJa: string;
  titleEn?: string;
}) {
  return (
    <div className="page-hero page-hero--solid">
      <h1 className="page-hero__title">{titleJa}</h1>
      <p className="page-hero__subtitle" lang="en" translate="no">{titleEn || ""}</p>
    </div>
  );
}
