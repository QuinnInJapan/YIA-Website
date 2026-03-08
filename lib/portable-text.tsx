import type { PortableTextComponents } from "@portabletext/react";
import { urlFor } from "@/lib/sanity/image";

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
