"use client";

import { useMemo } from "react";
import { useClient } from "sanity";
import { TextInput } from "@sanity/ui";
import createImageUrlBuilder from "@sanity/image-url";
import { i18nGet, i18nSet } from "../shared/i18n";
import { SectionWrapper } from "./SectionWrapper";
import { useFocusContext } from "../shared/FocusContext";
import { fs } from "@/sanity/lib/studioTokens";
import { FieldLabel, OverlayButton, ImageOverlayActions } from "./HeroSection";
import type {
  HomepageData,
  ImageField,
  UpdateFieldFn,
  OpenPickerFn,
  ShowHotspotCropFn,
} from "./types";

export function ActivityGridSection({
  homepage,
  updateField,
  onOpenImagePicker,
  onShowHotspotCrop,
}: {
  homepage: HomepageData;
  updateField: UpdateFieldFn;
  onOpenImagePicker: OpenPickerFn;
  onShowHotspotCrop: ShowHotspotCropFn;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(() => createImageUrlBuilder(client), [client]);
  const { setFocus, clearFocus } = useFocusContext();
  const grid = homepage.activityGrid;
  const images = grid?.images ?? [];
  const stat = grid?.stat;

  function handlePickImage(index: number) {
    onOpenImagePicker((assetId: string) => {
      const newImages = [...images];
      while (newImages.length <= index) newImages.push({} as ImageField);
      newImages[index] = {
        _type: "image",
        _key: `img${index}`,
        asset: { _type: "reference", _ref: assetId },
      };
      updateField("homepage", "homepage", "activityGrid", {
        ...grid,
        images: newImages,
      });
    });
  }

  function handleHotspot(index: number) {
    const img = images[index];
    if (!img?.asset?._ref) return;
    const url = builder.image(img).width(1200).auto("format").url();
    onShowHotspotCrop(
      url,
      {
        hotspot: img.hotspot ?? { x: 0.5, y: 0.5, width: 0.3, height: 0.3 },
        crop: img.crop ?? { top: 0, bottom: 0, left: 0, right: 0 },
      },
      ({ hotspot, crop }) => {
        const newImages = [...images];
        newImages[index] = {
          ...img,
          hotspot: { _type: "sanity.imageHotspot", ...hotspot },
          crop: { _type: "sanity.imageCrop", ...crop },
        };
        updateField("homepage", "homepage", "activityGrid", {
          ...grid,
          images: newImages,
        });
      },
    );
  }

  function ImageCell({ index, area }: { index: number; area: string }) {
    const img = images[index];
    return (
      <div
        style={{
          gridArea: area,
          position: "relative",
          overflow: "hidden",
          background: "#e8e8e8",
        }}
      >
        {img?.asset?._ref ? (
          <ImageOverlayActions
            buttons={
              <>
                <OverlayButton label="変更" onClick={() => handlePickImage(index)} />
                <OverlayButton label="切り抜き" onClick={() => handleHotspot(index)} />
              </>
            }
          >
            <img
              src={builder.image(img).width(600).height(400).fit("crop").auto("format").url()}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </ImageOverlayActions>
        ) : (
          <button
            type="button"
            onClick={() => handlePickImage(index)}
            style={{
              width: "100%",
              height: "100%",
              border: "2px dashed #ccc",
              background: "transparent",
              color: "#999",
              cursor: "pointer",
              fontSize: fs.body,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            + 画像
          </button>
        )}
      </div>
    );
  }

  return (
    <div onFocusCapture={() => setFocus("activityGrid")} onBlurCapture={clearFocus}>
      <SectionWrapper
        id="section-activity"
        title="活動グリッド"
        onExpand={() => setFocus("activityGrid")}
      >
        {/* High-fidelity grid matching the actual homepage layout:
          4 equal columns, 3 rows
          "a a b c"   img[0](2col)  stat(1col)   img[1](1col)
          "d e e f"   img[2](1col)  join(2col)   img[3](1col)
          "g h h i"   blog(1col)    img[4](2col) img[5](1col)
      */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: "repeat(3, 120px)",
            gridTemplateAreas: `
            "a a b c"
            "d e e f"
            "g h h i"
          `,
            gap: 2,
            borderRadius: 6,
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          {/* (a) img[0] — spans 2 columns */}
          <ImageCell index={0} area="a" />

          {/* (b) Stat tile — navy background with editable value */}
          <div
            style={{
              gridArea: "b",
              background: "#1b2e4a",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: 8,
            }}
          >
            <input
              type="number"
              value={stat?.value ?? ""}
              onChange={(e) =>
                updateField("homepage", "homepage", "activityGrid", {
                  ...grid,
                  stat: { ...stat, value: e.target.value ? Number(e.target.value) : undefined },
                })
              }
              style={{
                width: "90%",
                textAlign: "center",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 0,
                padding: "2px 0",
                fontSize: 28 /* intentional: display/heading size */,
                fontWeight: 900,
                background: "transparent",
                color: "#fff",
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
              placeholder="0"
            />
            <div
              style={{
                fontSize: fs.meta,
                opacity: 0.8,
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              {i18nGet(stat?.label, "ja") || "ラベル"}
            </div>
          </div>

          {/* (c) img[1] */}
          <ImageCell index={1} area="c" />

          {/* (d) img[2] */}
          <ImageCell index={2} area="d" />

          {/* (e) Join/membership tile — gold, spans 2 columns */}
          <div
            style={{
              gridArea: "e",
              background: "#c8a84e",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: fs.body,
              fontWeight: 600,
            }}
          >
            <div style={{ textAlign: "center", lineHeight: 1.4 }}>
              入会案内
              <span
                style={{ display: "block", fontSize: fs.label, fontWeight: 400, opacity: 0.85 }}
              >
                Join Us
              </span>
            </div>
          </div>

          {/* (f) img[3] */}
          <ImageCell index={3} area="f" />

          {/* (g) Blog tile — dark navy */}
          <div
            style={{
              gridArea: "g",
              background: "#0f1e33",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: fs.body,
              fontWeight: 500,
            }}
          >
            <div style={{ textAlign: "center", lineHeight: 1.4 }}>
              活動ブログ
              <span
                style={{ display: "block", fontSize: fs.label, fontWeight: 400, opacity: 0.85 }}
              >
                Activity Blog
              </span>
            </div>
          </div>

          {/* (h) img[4] — spans 2 columns */}
          <ImageCell index={4} area="h" />

          {/* (i) img[5] */}
          <ImageCell index={5} area="i" />
        </div>

        {/* Stat label fields below the grid */}
        <FieldLabel label="統計ラベル（日本語）">
          <TextInput
            fontSize={1}
            value={i18nGet(stat?.label, "ja")}
            onChange={(e) =>
              updateField("homepage", "homepage", "activityGrid", {
                ...grid,
                stat: { ...stat, label: i18nSet(stat?.label, "ja", e.currentTarget.value) },
              })
            }
          />
        </FieldLabel>
        <FieldLabel label="統計ラベル（English）">
          <TextInput
            fontSize={1}
            value={i18nGet(stat?.label, "en")}
            onChange={(e) =>
              updateField("homepage", "homepage", "activityGrid", {
                ...grid,
                stat: { ...stat, label: i18nSet(stat?.label, "en", e.currentTarget.value) },
              })
            }
          />
        </FieldLabel>
      </SectionWrapper>
    </div>
  );
}
