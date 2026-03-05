import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { Nl2br } from "@/lib/helpers";
import { imageUrl, hotspotPosition } from "@/lib/sanity/image";
import type { ImageFile } from "@/lib/types";
import type { I18nString, I18nBlocks } from "@/lib/i18n";
import { ja, en, jaBlocks, enBlocks } from "@/lib/i18n";

function isBlocks(field: I18nString | I18nBlocks | undefined): field is I18nBlocks {
  if (!field || field.length === 0) return false;
  return Array.isArray(field[0]?.value);
}

interface PageHeroProps {
  titleJa: string;
  titleEn?: string;
  description?: I18nString | I18nBlocks;
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
  let descHtml: React.ReactNode = null;

  if (description && isBlocks(description)) {
    const jaB = jaBlocks(description);
    const enB = enBlocks(description);
    if (jaB.length > 0 || enB.length > 0) {
      descHtml = (
        <div className="page-hero__description">
          {jaB.length > 0 && (
            <div>
              <PortableText value={jaB} />
            </div>
          )}
          {enB.length > 0 && (
            <div className="page-hero__description-en" lang="en">
              <PortableText value={enB} />
            </div>
          )}
        </div>
      );
    }
  } else {
    const jaText = descriptionJa ?? (description ? ja(description) : "");
    const enText = descriptionEn ?? (description ? en(description) : "");
    if (jaText) {
      descHtml = (
        <div className="page-hero__description">
          <p>
            <Nl2br text={jaText} />
          </p>
          {enText && (
            <p className="page-hero__description-en" lang="en">
              <Nl2br text={enText} />
            </p>
          )}
        </div>
      );
    }
  }

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
        <p className="page-hero__subtitle" lang="en">{titleEn || ""}</p>
        {descHtml}
      </div>
    );
  }

  // Solid hero fallback
  return (
    <div className="page-hero page-hero--solid">
      <h1 className="page-hero__title">{titleJa}</h1>
      <p className="page-hero__subtitle" lang="en">{titleEn || ""}</p>
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
      <p className="page-hero__subtitle" lang="en">{titleEn || ""}</p>
    </div>
  );
}
