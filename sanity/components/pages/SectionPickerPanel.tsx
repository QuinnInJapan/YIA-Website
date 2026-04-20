import { fs } from "@/sanity/lib/studioTokens";
import { SECTION_TYPES, SECTION_TYPE_LABELS, SECTION_TYPE_META } from "./types";
import type { SectionTypeName } from "./types";
import { SectionPreview } from "./SectionPreviews";

export function SectionPickerPanel({
  onSelect,
  onClose,
}: {
  onSelect: (type: SectionTypeName) => void;
  onClose: () => void;
}) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--card-border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: fs.body, fontWeight: 600 }}>セクションを追加</span>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            fontSize: 18 /* intentional: display/heading size */,
            cursor: "pointer",
            color: "var(--card-muted-fg-color)",
            padding: "2px 6px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {SECTION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              style={{
                display: "flex",
                flexDirection: "column",
                border: "1px solid var(--card-border-color)",
                borderRadius: 8,
                background: "var(--card-bg-color)",
                cursor: "pointer",
                overflow: "hidden",
                textAlign: "left",
                padding: 0,
                transition: "border-color 120ms, box-shadow 120ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--card-focus-ring-color, #4a90d9)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--card-border-color)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  borderBottom: "1px solid var(--card-border-color)",
                  containerType: "inline-size",
                }}
              >
                <SectionPreview type={type} />
              </div>
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: fs.body, fontWeight: 600, color: "var(--card-fg-color)" }}>
                  {SECTION_TYPE_LABELS[type]}
                </div>
                <div
                  style={{
                    fontSize: fs.meta,
                    color: "var(--card-muted-fg-color)",
                    marginTop: 2,
                    lineHeight: 1.4,
                  }}
                >
                  {SECTION_TYPE_META[type].description}
                </div>
              </div>
            </button>
          ))}
        </div>
        <div style={{ height: 100 }} />
      </div>
    </div>
  );
}
