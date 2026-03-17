import { type ComponentType } from "react";
import { type ArrayFieldProps, useFormValue } from "sanity";
import imageUrlBuilder from "@sanity/image-url";
import { useClient } from "sanity";

/**
 * Custom field component for the page `images` array field.
 * Renders a large preview of the first (hero) image above the default array input,
 * giving editors a visual sense of how the page will look.
 */
export const HeroImageField: ComponentType<ArrayFieldProps> = (props) => {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = imageUrlBuilder(client);

  // Get the images array from the document (includes hotspot/crop on .file)
  const images = useFormValue(["images"]) as
    | Array<{
        file?: {
          asset?: { _ref: string };
          hotspot?: { x: number; y: number; width: number; height: number };
          crop?: { top: number; bottom: number; left: number; right: number };
        };
      }>
    | undefined;

  const firstFile = images?.[0]?.file;

  const heroUrl = firstFile?.asset?._ref
    ? builder.image(firstFile).width(800).height(360).fit("crop").quality(80).auto("format").url()
    : null;

  return (
    <div>
      {heroUrl && (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          }}
        >
          <img
            src={heroUrl}
            alt="Hero preview"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              maxHeight: 360,
              objectFit: "cover",
            }}
          />
          <div
            style={{
              padding: "6px 12px",
              fontSize: 12,
              color: "#666",
              background: "#f5f5f5",
            }}
          >
            ヒーロー画像プレビュー / Hero image preview
          </div>
        </div>
      )}
      {props.renderDefault(props)}
    </div>
  );
};
