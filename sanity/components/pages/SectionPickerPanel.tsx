import { SECTION_TYPES, SECTION_TYPE_LABELS, SECTION_TYPE_META } from "./types";
import type { SectionTypeName } from "./types";
import { SectionThumbnail } from "./SectionThumbnails";

export function SectionPickerPanel({
  onSelect,
  onClose,
}: {
  onSelect: (type: SectionTypeName) => void;
  onClose: () => void;
}) {
  const common = SECTION_TYPES.filter((t) => SECTION_TYPE_META[t].category === "common");
  const oneoff = SECTION_TYPES.filter((t) => SECTION_TYPE_META[t].category === "oneoff");

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
        <span style={{ fontSize: 13, fontWeight: 600 }}>セクションを追加</span>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            fontSize: 18,
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
        <SectionGroup label="よく使うセクション" types={common} onSelect={onSelect} />
        <div style={{ marginTop: 24 }}>
          <SectionGroup label="特殊セクション" types={oneoff} onSelect={onSelect} muted />
        </div>
        <div style={{ height: 100 }} />
      </div>
    </div>
  );
}

function SectionGroup({
  label,
  types,
  onSelect,
  muted,
}: {
  label: string;
  types: readonly SectionTypeName[];
  onSelect: (type: SectionTypeName) => void;
  muted?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: muted ? "var(--card-muted-fg-color)" : "var(--card-fg-color)",
          marginBottom: 10,
          opacity: muted ? 0.7 : 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 10,
        }}
      >
        {types.map((type) => (
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
                background: "var(--card-border-color)",
                padding: "8px 12px",
              }}
            >
              <SectionThumbnail type={type} />
            </div>
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--card-fg-color)" }}>
                {SECTION_TYPE_LABELS[type]}
              </div>
              <div
                style={{
                  fontSize: 11,
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
    </div>
  );
}
