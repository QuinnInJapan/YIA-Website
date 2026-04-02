"use client";

import { useMemo } from "react";
import { useClient } from "sanity";
import { TextInput } from "@sanity/ui";
import createImageUrlBuilder from "@sanity/image-url";
import { i18nGet, i18nSet } from "../shared/i18n";
import { SectionWrapper } from "./SectionWrapper";
import { useFocusContext } from "../shared/FocusContext";
import { FieldLabel, OverlayButton, ImageOverlayActions, EmptyImageSlot } from "./HeroSection";
import type { HomepageAboutData, UpdateFieldFn, OpenPickerFn, ShowHotspotCropFn } from "./types";

export function AboutSection({
  about,
  aboutId,
  updateField,
  onOpenImagePicker,
  onShowHotspotCrop,
}: {
  about: HomepageAboutData;
  aboutId: string;
  updateField: UpdateFieldFn;
  onOpenImagePicker: OpenPickerFn;
  onShowHotspotCrop: ShowHotspotCropFn;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(() => createImageUrlBuilder(client), [client]);
  const { setFocus, clearFocus } = useFocusContext();

  function handlePickImage() {
    onOpenImagePicker((assetId: string) => {
      updateField("homepageAbout", aboutId, "image", {
        _type: "image",
        asset: { _type: "reference", _ref: assetId },
      });
    });
  }

  function handleHotspot() {
    if (!about.image?.asset?._ref) return;
    const url = builder.image(about.image).width(1200).auto("format").url();
    onShowHotspotCrop(
      url,
      {
        hotspot: about.image.hotspot ?? { x: 0.5, y: 0.5, width: 0.3, height: 0.3 },
        crop: about.image.crop ?? { top: 0, bottom: 0, left: 0, right: 0 },
      },
      ({ hotspot, crop }) => {
        updateField("homepageAbout", aboutId, "image", {
          ...about.image,
          hotspot: { _type: "sanity.imageHotspot", ...hotspot },
          crop: { _type: "sanity.imageCrop", ...crop },
        });
      },
    );
  }

  return (
    <div onFocusCapture={() => setFocus("about")} onBlurCapture={clearFocus} onClick={() => setFocus("about")}>
      <SectionWrapper id="section-about" title="YIAについて">
        {/* Title fields */}
        <FieldLabel label="タイトル（日本語）">
          <TextInput
            fontSize={1}
            value={about.titleJa ?? ""}
            onChange={(e) =>
              updateField("homepageAbout", aboutId, "titleJa", e.currentTarget.value)
            }
          />
        </FieldLabel>
        <FieldLabel label="タイトル（English）">
          <TextInput
            fontSize={1}
            value={about.titleEn ?? ""}
            onChange={(e) =>
              updateField("homepageAbout", aboutId, "titleEn", e.currentTarget.value)
            }
          />
        </FieldLabel>

        {/* Photo */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
            写真
          </div>
          {about.image?.asset?._ref ? (
            <ImageOverlayActions
              buttons={
                <>
                  <OverlayButton label="変更" onClick={handlePickImage} />
                  <OverlayButton label="切り抜き" onClick={handleHotspot} />
                </>
              }
            >
              <div style={{ borderRadius: 6, overflow: "hidden", lineHeight: 0 }}>
                <img
                  src={builder
                    .image(about.image)
                    .width(720)
                    .height(200)
                    .fit("crop")
                    .auto("format")
                    .url()}
                  alt=""
                  style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }}
                />
              </div>
            </ImageOverlayActions>
          ) : (
            <EmptyImageSlot onClick={handlePickImage} />
          )}
        </div>

        {/* Alt text */}
        <FieldLabel label="代替テキスト（日本語）">
          <TextInput
            fontSize={1}
            value={i18nGet(about.imageAlt, "ja")}
            onChange={(e) =>
              updateField(
                "homepageAbout",
                aboutId,
                "imageAlt",
                i18nSet(about.imageAlt, "ja", e.currentTarget.value),
              )
            }
          />
        </FieldLabel>
        <FieldLabel label="代替テキスト（English）">
          <TextInput
            fontSize={1}
            value={i18nGet(about.imageAlt, "en")}
            onChange={(e) =>
              updateField(
                "homepageAbout",
                aboutId,
                "imageAlt",
                i18nSet(about.imageAlt, "en", e.currentTarget.value),
              )
            }
          />
        </FieldLabel>

        {/* Body fields */}
        <FieldLabel label="本文（日本語）">
          <textarea
            rows={5}
            value={about.bodyJa ?? ""}
            onChange={(e) => updateField("homepageAbout", aboutId, "bodyJa", e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid var(--card-border-color)",
              borderRadius: 4,
              fontSize: 13,
              fontFamily: "inherit",
              resize: "vertical",
              background: "transparent",
              color: "inherit",
            }}
          />
        </FieldLabel>
        <FieldLabel label="本文（English）">
          <textarea
            rows={5}
            value={about.bodyEn ?? ""}
            onChange={(e) => updateField("homepageAbout", aboutId, "bodyEn", e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid var(--card-border-color)",
              borderRadius: 4,
              fontSize: 13,
              fontFamily: "inherit",
              resize: "vertical",
              background: "transparent",
              color: "inherit",
            }}
          />
        </FieldLabel>
      </SectionWrapper>
    </div>
  );
}
