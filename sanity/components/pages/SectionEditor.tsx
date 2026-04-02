"use client";

import { ContentSectionEditor } from "./sections/ContentSectionEditor";
import { LinksSectionEditor } from "./sections/LinksSectionEditor";
import { GenericSectionEditor } from "./sections/GenericSectionEditor";
import type { DocumentLinkItem as SharedDocumentLinkItem } from "../shared/DocumentDetailPanel";
import type { SectionItem } from "./types";
import { useFocusContext } from "../shared/FocusContext";

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
      default:
        // warnings, gallery, table, labelTable, infoCards, imageCards
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
        {renderEditor()}
      </div>
    </div>
  );
}
