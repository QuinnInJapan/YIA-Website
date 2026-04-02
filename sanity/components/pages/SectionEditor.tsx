"use client";

import { ContentSectionEditor } from "./sections/ContentSectionEditor";
import { InfoTableSectionEditor } from "./sections/InfoTableSectionEditor";
import { LinksSectionEditor } from "./sections/LinksSectionEditor";

import { EventScheduleSectionEditor } from "./sections/EventScheduleSectionEditor";
import { GroupScheduleSectionEditor } from "./sections/GroupScheduleSectionEditor";
import { TableScheduleSectionEditor } from "./sections/TableScheduleSectionEditor";
import { HistorySectionEditor } from "./sections/HistorySectionEditor";
import { DefinitionsSectionEditor } from "./sections/DefinitionsSectionEditor";
import { BoardMembersSectionEditor } from "./sections/BoardMembersSectionEditor";
import { FeeTableSectionEditor } from "./sections/FeeTableSectionEditor";
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
      case "infoTable":
        return <InfoTableSectionEditor section={section} onUpdateField={onUpdateField} />;
      case "links":
        return (
          <LinksSectionEditor
            section={section}
            onUpdateField={onUpdateField}
            onOpenFilePicker={onOpenFilePicker}
            onOpenDocumentDetail={onOpenDocumentDetail}
          />
        );
      case "eventSchedule":
        return <EventScheduleSectionEditor section={section} onUpdateField={onUpdateField} />;
      case "groupSchedule":
        return <GroupScheduleSectionEditor section={section} onUpdateField={onUpdateField} />;
      case "tableSchedule":
        return <TableScheduleSectionEditor section={section} onUpdateField={onUpdateField} />;
      case "history":
        return <HistorySectionEditor section={section} onUpdateField={onUpdateField} />;
      case "definitions":
        return <DefinitionsSectionEditor section={section} onUpdateField={onUpdateField} />;
      case "boardMembers":
        return <BoardMembersSectionEditor section={section} onUpdateField={onUpdateField} />;
      case "feeTable":
        return <FeeTableSectionEditor section={section} onUpdateField={onUpdateField} />;
      default:
        // warnings, directoryList, sisterCities, fairTrade, flyers
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
