import type { GallerySection, ImageFile } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import { imageUrl } from "@/lib/sanity/image";
import PhotoGalleryWrapper from "@/components/PhotoGalleryWrapper";

export function buildGalleryImages(images: ImageFile[]) {
  return images
    .filter((img) => img.file?.asset?._ref)
    .map((img) => ({
      src: imageUrl(img.file),
      alt: ja(img.caption) || "",
      captionJa: ja(img.caption),
      captionEn: en(img.caption),
    }));
}

export const gallery: SectionHandler<GallerySection> = (s, ctx) => {
  const galleryImages = buildGalleryImages(s.images);
  if (galleryImages.length) {
    ctx.push(<PhotoGalleryWrapper images={galleryImages} />);
    ctx.flush();
  }
};
