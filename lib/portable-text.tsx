import type { PortableTextComponents } from "@portabletext/react";
import { urlFor } from "@/lib/sanity/image";
import YouTubeEmbed from "@/components/YouTubeEmbed";

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

/** Extended portable text components for blog posts — adds callout and YouTube blocks. */
export const blogPtComponents: PortableTextComponents = {
  ...ptComponents,
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
  },
};
