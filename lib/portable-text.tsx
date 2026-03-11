import type React from "react";
import type { PortableTextComponents } from "@portabletext/react";
import { urlFor, imageUrl, imageLqip } from "@/lib/sanity/image";
import { ja, en } from "@/lib/i18n";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import PhotoGalleryWrapper from "@/components/PhotoGalleryWrapper";
import type { I18nString } from "@/lib/i18n";
import type { SanityImage } from "@/lib/types";

interface ImageFileValue {
  file?: SanityImage;
  caption?: I18nString;
}

export const ptComponents: PortableTextComponents = {
  types: {
    image: ({ value }: { value: { asset: { _ref: string }; alt?: string } }) => {
      if (!value?.asset?._ref) return null;
      const src = urlFor(value).auto("format").quality(90).url();
      return (
        <figure style={{ margin: "1em 0" }}>
          <img
            src={src}
            alt={value.alt || ""}
            style={{ maxWidth: "100%", height: "auto", borderRadius: 4 }}
          />
        </figure>
      );
    },
  },
};

/** Blog portable text components with optional id mapping for h2 headings. */
export function makeBlogPtComponents(h2IdMap?: Record<string, string>): PortableTextComponents {
  return {
    ...ptComponents,
    block: {
      h2: ({ children, value }: { children?: React.ReactNode; value: { _key?: string } }) => (
        <h2 id={value._key ? (h2IdMap?.[value._key] ?? value._key) : undefined}>{children}</h2>
      ),
    },
    types: {
      ...ptComponents.types,
      callout: ({ value }: { value: { tone?: string; body?: string } }) => {
        const tone = value.tone || "info";
        return (
          <aside className={`pt-callout pt-callout--${tone}`}>
            <p>{value.body}</p>
          </aside>
        );
      },
      youtube: ({ value }: { value: { url: string; caption?: string } }) => (
        <YouTubeEmbed url={value.url} caption={value.caption} />
      ),
      inlineGallery: ({ value }: { value: { images?: ImageFileValue[] } }) => {
        const images = (value.images ?? [])
          .filter((img) => img.file?.asset?._ref)
          .map((img) => ({
            src: imageUrl(img.file!),
            lqip: imageLqip(img.file!),
            alt: ja(img.caption) || "",
            captionJa: ja(img.caption),
            captionEn: en(img.caption),
          }));
        if (!images.length) return null;
        return <PhotoGalleryWrapper images={images} />;
      },
    },
  };
}

export const blogPtComponents = makeBlogPtComponents();
