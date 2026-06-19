"use client";

import { fs } from "@/sanity/lib/studioTokens";
import { ContentSectionEditor } from "./sections/ContentSectionEditor";
import { LinksSectionEditor } from "./sections/LinksSectionEditor";
import { LabelTableSectionEditor } from "./sections/LabelTableSectionEditor";
import { InfoCardsSectionEditor } from "./sections/InfoCardsSectionEditor";
import { ImageCardsSectionEditor } from "./sections/ImageCardsSectionEditor";
import { GenericSectionEditor } from "./sections/GenericSectionEditor";
import type { DocumentLinkItem as SharedDocumentLinkItem } from "../shared/DocumentDetailPanel";
import type { SectionItem } from "./types";
import { useFocusContext } from "../shared/FocusContext";

type TocLevel = "section" | "subsection" | "hidden";

const TOC_SECTION_TYPES = new Set([
  "content",
  "links",
  "table",
  "labelTable",
  "infoCards",
  "imageCards",
]);

const TOC_LEVEL_OPTIONS: { value: TocLevel; label: string; description: string }[] = [
  {
    value: "section",
    label: "大見出し",
    description: "目次に通常項目として表示",
  },
  {
    value: "subsection",
    label: "小見出し",
    description: "直前の大見出しの下に表示",
  },
  {
    value: "hidden",
    label: "本文のみ",
    description: "ページには表示し、目次には表示しない",
  },
];

export function SectionEditor({
  section,
  onUpdateField,
  onOpenImagePicker,
  onOpenFilePicker,
  onOpenDocumentDetail,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
  onOpenImagePicker: (onSelect: (assetId: string) => void) => void;
  onOpenFilePicker?: (onSelect: (assetId: string, filename: string, ext: string) => void) => void;
  onOpenDocumentDetail?: (
    doc: SharedDocumentLinkItem,
    onUpdate: (doc: SharedDocumentLinkItem) => void,
    onRemove: () => void,
  ) => void;
}) {
  const { setFocus, clearFocus } = useFocusContext();

  function renderEditor() {
    switch (section._type) {
      case "content":
        return <ContentSectionEditor section={section} onUpdateField={onUpdateField} />;
      case "links":
        return (
          <LinksSectionEditor
            section={section}
            onUpdateField={onUpdateField}
            onOpenFilePicker={onOpenFilePicker}
            onOpenDocumentDetail={onOpenDocumentDetail}
          />
        );
      case "labelTable":
        return <LabelTableSectionEditor section={section} onUpdateField={onUpdateField} />;
      case "infoCards":
        return <InfoCardsSectionEditor section={section} onUpdateField={onUpdateField} />;
      case "imageCards":
        return (
          <ImageCardsSectionEditor
            section={section}
            onUpdateField={onUpdateField}
            onOpenImagePicker={onOpenImagePicker}
          />
        );
      default:
        // warnings, gallery, and any unknown future types
        return <GenericSectionEditor section={section} onUpdateField={onUpdateField} />;
    }
  }

  return (
    <div onFocusCapture={() => setFocus(section._key)} onBlurCapture={clearFocus}>
      <div
        style={{
          padding: "12px 16px",
          border: "1px solid var(--card-border-color)",
          borderTop: "none",
          borderRadius: "0 0 4px 4px",
          background: "var(--card-bg-color)",
        }}
      >
        {TOC_SECTION_TYPES.has(section._type) && (
          <TocLevelControl
            value={(section.tocLevel as TocLevel | undefined) ?? "section"}
            onChange={(value) => onUpdateField("tocLevel", value)}
          />
        )}
        {renderEditor()}
      </div>
    </div>
  );
}

function TocLevelControl({
  value,
  onChange,
}: {
  value: TocLevel;
  onChange: (value: TocLevel) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: fs.label,
          fontWeight: 600,
          color: "var(--card-fg-color)",
          marginBottom: 6,
        }}
      >
        目次での扱い
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {TOC_LEVEL_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              padding: "6px 8px",
              border: `1px solid ${
                value === option.value
                  ? "var(--card-focus-ring-color, #5b9cf6)"
                  : "var(--card-border-color)"
              }`,
              borderRadius: 4,
              background:
                value === option.value ? "var(--card-focus-ring-color, #5b9cf6)" : "transparent",
              color: value === option.value ? "#fff" : "var(--card-fg-color)",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
            }}
          >
            <span style={{ display: "block", fontSize: fs.label, fontWeight: 700 }}>
              {option.label}
            </span>
            <span
              style={{
                display: "block",
                marginTop: 2,
                fontSize: fs.meta,
                color:
                  value === option.value
                    ? "rgba(255, 255, 255, 0.78)"
                    : "var(--card-muted-fg-color)",
                lineHeight: 1.35,
              }}
            >
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
