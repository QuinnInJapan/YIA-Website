"use client";

import { useClient } from "sanity";
import createImageUrlBuilder from "@sanity/image-url";
import { TrashIcon } from "@sanity/icons";
import type { SectionItem } from "../types";

interface GalleryImage {
  _key: string;
  _type: "imageFile";
  file?: { asset?: { _ref: string } };
  caption?: { _key: string; value: string }[];
}

export function GallerySectionEditor({
  section,
  onUpdateField,
  onOpenImagePicker,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
  onOpenImagePicker: (onSelect: (assetId: string) => void) => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = createImageUrlBuilder(client);
  const images = (section.images as GalleryImage[]) ?? [];

  function handleAdd() {
    onOpenImagePicker((assetId: string) => {
      const newImage: GalleryImage = {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        _type: "imageFile",
        file: { asset: { _ref: assetId } },
      };
      onUpdateField("images", [...images, newImage]);
    });
  }

  function handleRemove(key: string) {
    onUpdateField(
      "images",
      images.filter((img) => img._key !== key),
    );
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
        画像（{images.length}枚）
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: 8,
          marginBottom: 8,
        }}
      >
        {images.map((img) => {
          const assetRef = img.file?.asset?._ref;
          return (
            <div
              key={img._key}
              style={{
                position: "relative",
                borderRadius: 4,
                overflow: "hidden",
                aspectRatio: "1",
                background: "var(--card-code-bg-color, rgba(0,0,0,0.03))",
              }}
            >
              {assetRef && (
                <img
                  src={builder
                    .image({ asset: { _ref: assetRef } })
                    .width(200)
                    .height(200)
                    .fit("crop")
                    .auto("format")
                    .url()}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
              <button
                type="button"
                onClick={() => handleRemove(img._key)}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  padding: "2px 4px",
                  border: "none",
                  borderRadius: 3,
                  background: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <TrashIcon />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        style={{
          width: "100%",
          padding: "12px 0",
          border: "1px dashed var(--card-border-color)",
          borderRadius: 6,
          background: "transparent",
          color: "var(--card-muted-fg-color)",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        + 画像を追加
      </button>
    </div>
  );
}
