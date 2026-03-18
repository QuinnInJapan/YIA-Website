import { useMemo } from "react";
import { renderSections } from "@/lib/section-renderer";
import type { PageSection } from "@/lib/types";
import type { SectionTypeName } from "./types";
import { sampleSections } from "./sampleSections";

// ── Image-dependent fallbacks ────────────────────────────
// These types need Sanity asset refs that can't resolve in
// the Studio, so we show lightweight inline-style previews.

const navy = "#1e3a5f";
const white = "#fff";

const inlineFallbacks: Partial<Record<SectionTypeName, React.ReactNode>> = {
  gallery: (
    <div style={{ padding: "10px 14px 6px", background: white }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            style={{
              aspectRatio: "4/3",
              borderRadius: 3,
              background: `hsl(${200 + i * 20}, ${30 + i * 5}%, ${70 - i * 5}%)`,
            }}
          />
        ))}
      </div>
    </div>
  ),

  flyers: (
    <div
      style={{
        padding: "10px 14px",
        background: white,
        display: "flex",
        gap: 8,
        justifyContent: "center",
      }}
    >
      {["#e8d5c0", "#c0d5e8"].map((bg, i) => (
        <div
          key={i}
          style={{
            width: 70,
            height: 96,
            borderRadius: 4,
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            color: navy,
            fontWeight: 600,
            textAlign: "center",
            lineHeight: 1.3,
            padding: 6,
          }}
        >
          {i === 0 ? "国際フェスティバル" : "日本語教室"}
        </div>
      ))}
    </div>
  ),

  sisterCities: (
    <div style={{ background: white }}>
      <div style={{ display: "flex" }}>
        <div
          style={{
            flex: 3,
            background: "linear-gradient(135deg, #6b8cae, #3d6a8f)",
            minHeight: 80,
          }}
        />
        <div
          style={{
            flex: 2,
            background: navy,
            color: white,
            padding: "10px 10px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 8,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              opacity: 0.7,
            }}
          >
            USA
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>Springfield</div>
          <div style={{ fontSize: 10, opacity: 0.8, marginTop: 1 }}>スプリングフィールド市</div>
        </div>
      </div>
    </div>
  ),
};

// ── Real component preview ───────────────────────────────
// For most section types, render through the actual
// renderSections() pipeline so previews stay in sync with
// production components and CSS.

function RenderedPreview({ section }: { section: PageSection }) {
  const { groups } = useMemo(() => renderSections([section]), [section]);
  return (
    <div
      style={{
        background: "#fff",
        color: "#333",
        fontFamily: "var(--font-body)",
        lineHeight: 1.7,
        fontSize: 16,
      }}
    >
      <div className="layout-program">{groups}</div>
    </div>
  );
}

// ── Scaled preview container ─────────────────────────────

const PREVIEW_W = 400;
const DISPLAY_H = 160;
const SCALE = 0.6;

export function SectionPreview({ type }: { type: SectionTypeName }) {
  const fallback = inlineFallbacks[type];
  const sample = sampleSections[type];

  const content = fallback ?? (sample ? <RenderedPreview section={sample} /> : null);

  return (
    <div
      style={{
        width: "100%",
        height: DISPLAY_H,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          width: PREVIEW_W,
          transformOrigin: "top left",
          transform: `scale(${SCALE})`,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {content}
      </div>
    </div>
  );
}
