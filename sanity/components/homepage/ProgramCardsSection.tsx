"use client";

import { useMemo } from "react";
import { useClient } from "sanity";
import createImageUrlBuilder from "@sanity/image-url";
import { i18nGet } from "../shared/i18n";
import { SectionWrapper } from "./SectionWrapper";
import { OverlayButton, EmptyImageSlot } from "./HeroSection";
import type { CategoryData, UpdateFieldFn, OpenPickerFn, ShowHotspotCropFn } from "./types";

export function ProgramCardsSection({
  categories,
  updateField,
  onOpenImagePicker,
  onShowHotspotCrop,
}: {
  categories: CategoryData[];
  updateField: UpdateFieldFn;
  onOpenImagePicker: OpenPickerFn;
  onShowHotspotCrop: ShowHotspotCropFn;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(() => createImageUrlBuilder(client), [client]);

  function handlePick(cat: CategoryData) {
    onOpenImagePicker((assetId: string) => {
      updateField("category", cat._id, "heroImage", {
        _type: "image",
        asset: { _type: "reference", _ref: assetId },
      });
    });
  }

  function handleHotspot(cat: CategoryData) {
    if (!cat.heroImage?.asset?._ref) return;
    const url = builder.image(cat.heroImage).width(1200).auto("format").url();
    onShowHotspotCrop(
      url,
      {
        hotspot: cat.heroImage.hotspot ?? { x: 0.5, y: 0.5, width: 0.3, height: 0.3 },
        crop: cat.heroImage.crop ?? { top: 0, bottom: 0, left: 0, right: 0 },
      },
      ({ hotspot, crop }) => {
        updateField("category", cat._id, "heroImage", {
          ...cat.heroImage,
          hotspot: { _type: "sanity.imageHotspot", ...hotspot },
          crop: { _type: "sanity.imageCrop", ...crop },
        });
      },
    );
  }

  return (
    <SectionWrapper id="section-programs" title="プログラム">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {categories
          .filter((cat) => cat._id !== "category-about")
          .map((cat) => (
            <div key={cat._id}>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--card-muted-fg-color)",
                  marginBottom: 6,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {i18nGet(cat.label, "ja")} / {i18nGet(cat.label, "en")}
              </div>
              {cat.heroImage?.asset?._ref ? (
                <div
                  style={{
                    position: "relative",
                    borderRadius: 6,
                    overflow: "hidden",
                    lineHeight: 0,
                    aspectRatio: "16 / 9",
                  }}
                >
                  <img
                    src={builder
                      .image(cat.heroImage)
                      .width(400)
                      .height(225)
                      .fit("crop")
                      .auto("format")
                      .url()}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                  <div style={{ position: "absolute", top: 4, right: 4, display: "flex", gap: 4 }}>
                    <OverlayButton label="変更" onClick={() => handlePick(cat)} />
                    <OverlayButton label="切り抜き" onClick={() => handleHotspot(cat)} />
                  </div>
                </div>
              ) : (
                <EmptyImageSlot onClick={() => handlePick(cat)} />
              )}
            </div>
          ))}
      </div>
    </SectionWrapper>
  );
}
