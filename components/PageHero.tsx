import Image from "next/image";
import { Nl2br } from "@/lib/helpers";
import { resolveImage, resolveImageLocal, getImageWidth, HERO_MIN_WIDTH } from "@/lib/images";
import path from "path";
import type { ImageFile } from "@/lib/types";

interface PageHeroProps {
  titleJa: string;
  titleEn?: string;
  descriptionJa?: string;
  descriptionEn?: string;
  images?: ImageFile[];
}

export default function PageHero({
  titleJa,
  titleEn,
  descriptionJa,
  descriptionEn,
  images,
}: PageHeroProps) {
  const descHtml = descriptionJa ? (
    <div className="page-hero__description">
      <p>
        <Nl2br text={descriptionJa} />
      </p>
      {descriptionEn && (
        <p className="page-hero__description-en" lang="en">
          <Nl2br text={descriptionEn} />
        </p>
      )}
    </div>
  ) : null;

  // Try to use first image as hero background
  const allImages = (images || []).map((img) => img.file);
  if (allImages.length > 0) {
    const heroImg = resolveImage(allImages[0]);
    const heroLocal = resolveImageLocal(allImages[0]);
    const heroFilePath = path.join(
      process.cwd(),
      "public",
      decodeURIComponent(heroLocal)
    );
    const heroWidth = getImageWidth(heroFilePath);
    if (heroWidth >= HERO_MIN_WIDTH) {
      return (
        <div className="page-hero">
          <Image
            src={heroImg}
            alt=""
            fill
            sizes="100vw"
            className="page-hero__img"
          />
          <h1 className="page-hero__title">{titleJa}</h1>
          <p className="page-hero__subtitle" lang="en">{titleEn || ""}</p>
          {descHtml}
        </div>
      );
    }
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
