"use client";

import { TextInput } from "@sanity/ui";
import createImageUrlBuilder from "@sanity/image-url";
import { useClient } from "sanity";
import { useMemo } from "react";
import { i18nGet, i18nSet } from "../shared/i18n";
import { SectionWrapper } from "./SectionWrapper";
import type { HomepageData, SiteSettingsData, UpdateFieldFn, OpenPickerFn } from "./types";

export function HeroSection({
  homepage,
  siteSettings,
  updateField,
  onOpenImagePicker,
  onShowHotspotCrop,
}: {
  homepage: HomepageData;
  siteSettings: SiteSettingsData;
  updateField: UpdateFieldFn;
  onOpenImagePicker: OpenPickerFn;
  onShowHotspotCrop: (
    imageUrl: string,
    value: { hotspot: any; crop: any },
    onChange: (v: { hotspot: any; crop: any }) => void,
  ) => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(() => createImageUrlBuilder(client), [client]);
  const heroImage = homepage.hero?.image;

  function handlePickHero() {
    onOpenImagePicker((assetId: string) => {
      updateField("homepage", "homepage", "hero", {
        ...homepage.hero,
        image: { _type: "image", asset: { _type: "reference", _ref: assetId } },
      });
    });
  }

  function handleHotspot() {
    if (!heroImage?.asset?._ref) return;
    const url = builder.image(heroImage).width(1200).auto("format").url();
    onShowHotspotCrop(
      url,
      {
        hotspot: heroImage.hotspot ?? { x: 0.5, y: 0.5, width: 0.3, height: 0.3 },
        crop: heroImage.crop ?? { top: 0, bottom: 0, left: 0, right: 0 },
      },
      ({ hotspot, crop }) => {
        updateField("homepage", "homepage", "hero", {
          ...homepage.hero,
          image: {
            ...heroImage,
            hotspot: { _type: "sanity.imageHotspot", ...hotspot },
            crop: { _type: "sanity.imageCrop", ...crop },
          },
        });
      },
    );
  }

  return (
    <SectionWrapper id="section-hero" title="ヒーロー">
      {/* Hero image */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
          ヒーロー画像
        </div>
        {heroImage?.asset?._ref ? (
          <div
            style={{
              position: "relative",
              borderRadius: 6,
              overflow: "hidden",
              aspectRatio: "16 / 9",
              background: "#0f1932",
              containerType: "inline-size" as any,
            }}
          >
            {/* Image — matches hero-viewport__img */}
            <img
              src={builder
                .image(heroImage)
                .width(1200)
                .height(675)
                .fit("crop")
                .auto("format")
                .url()}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {/* Radial vignette — matches hero-viewport::before */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse at center, rgba(15,25,50,0.45) 0%, rgba(15,25,50,0.7) 100%)",
                pointerEvents: "none",
              }}
            />
            {/* Text overlay — matches hero__overlay structure exactly */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                textAlign: "center",
                color: "#fff",
                padding: "0 8%",
              }}
            >
              {/* hero__title */}
              <p
                style={{
                  fontSize: "clamp(18px, 4cqw, 40px)",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  margin: "0 0 4px",
                  textShadow: "0 1px 10px rgba(0,0,0,0.5)",
                  lineHeight: 1.2,
                }}
              >
                {i18nGet(siteSettings.org?.name, "ja") || "団体名"}
              </p>
              {/* hero__subtitle */}
              <p
                style={{
                  fontSize: "clamp(8px, 1.5cqw, 14px)",
                  fontWeight: 400,
                  letterSpacing: "0.14em",
                  margin: "0 0 clamp(10px, 3cqw, 24px)",
                  opacity: 0.85,
                  lineHeight: 1.3,
                }}
              >
                {i18nGet(siteSettings.org?.name, "en") || "Organization Name"}
              </p>
              {/* hero__tagline */}
              <p
                style={{
                  fontSize: "clamp(9px, 1.4cqw, 13px)",
                  fontWeight: 500,
                  margin: "0 0 2px",
                  lineHeight: 1.3,
                }}
              >
                {i18nGet(homepage.hero?.tagline, "ja") || "キャッチコピー"}
              </p>
              {/* hero__tagline-en */}
              <p
                style={{
                  fontSize: "clamp(7px, 1.1cqw, 11px)",
                  fontWeight: 400,
                  margin: 0,
                  opacity: 0.7,
                  lineHeight: 1.3,
                }}
              >
                {i18nGet(homepage.hero?.tagline, "en") || "Tagline"}
              </p>
            </div>
            {/* Editor controls */}
            <div
              style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4, zIndex: 1 }}
            >
              <OverlayButton label="変更" onClick={handlePickHero} />
              <OverlayButton label="切り抜き" onClick={handleHotspot} />
            </div>
          </div>
        ) : (
          <EmptyImageSlot onClick={handlePickHero} />
        )}
      </div>

      {/* Tagline */}
      <FieldLabel label="キャッチコピー（日本語）">
        <TextInput
          fontSize={1}
          value={i18nGet(homepage.hero?.tagline, "ja")}
          onChange={(e) =>
            updateField("homepage", "homepage", "hero", {
              ...homepage.hero,
              tagline: i18nSet(homepage.hero?.tagline, "ja", e.currentTarget.value),
            })
          }
        />
      </FieldLabel>
      <FieldLabel label="キャッチコピー（English）">
        <TextInput
          fontSize={1}
          value={i18nGet(homepage.hero?.tagline, "en")}
          onChange={(e) =>
            updateField("homepage", "homepage", "hero", {
              ...homepage.hero,
              tagline: i18nSet(homepage.hero?.tagline, "en", e.currentTarget.value),
            })
          }
        />
      </FieldLabel>

      {/* Org name */}
      <FieldLabel label="団体名（日本語）">
        <TextInput
          fontSize={1}
          value={i18nGet(siteSettings.org?.name, "ja")}
          onChange={(e) =>
            updateField("siteSettings", "siteSettings", "org", {
              ...siteSettings.org,
              name: i18nSet(siteSettings.org?.name, "ja", e.currentTarget.value),
            })
          }
        />
      </FieldLabel>
      <FieldLabel label="団体名（English）">
        <TextInput
          fontSize={1}
          value={i18nGet(siteSettings.org?.name, "en")}
          onChange={(e) =>
            updateField("siteSettings", "siteSettings", "org", {
              ...siteSettings.org,
              name: i18nSet(siteSettings.org?.name, "en", e.currentTarget.value),
            })
          }
        />
      </FieldLabel>
    </SectionWrapper>
  );
}

// ── Shared helpers ──────────────────────────────────

export function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export function OverlayButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "3px 8px",
        borderRadius: 4,
        border: "none",
        background: "rgba(0,0,0,0.55)",
        color: "#fff",
        fontSize: 11,
        cursor: "pointer",
        backdropFilter: "blur(4px)",
      }}
    >
      {label}
    </button>
  );
}

export function EmptyImageSlot({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        padding: "20px 0",
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
  );
}
