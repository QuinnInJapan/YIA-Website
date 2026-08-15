import React from "react";
import type { PageSection, TocEntry, TocLevel } from "@/lib/types";
import { tocId } from "@/lib/toc-id";
import { ja, en } from "@/lib/i18n";
import { sectionHandlers } from "./section-renderers";
import SectionHeader from "@/components/SectionHeader";
import { StudioRegion } from "@/lib/components/StudioRegion";

export type { TocEntry } from "@/lib/types";

interface SectionBuilderResult {
  groups: React.ReactNode;
  tocEntries: TocEntry[];
}

export function renderSections(sections: PageSection[]): SectionBuilderResult {
  const groups: React.ReactNode[] = [];
  let current: React.ReactNode[] = [];
  const tocEntries: TocEntry[] = [];
  const tocOccurrences = new Map<string, number>();

  let currentSectionId: string | undefined;
  let currentSectionKey: string | undefined;
  let currentTocLevel: TocLevel = "section";

  function flush() {
    if (current.length) {
      groups.push(
        <StudioRegion
          as="div"
          className="page-section"
          id={currentSectionId}
          studioId={currentSectionKey ?? ""}
          key={`section-${groups.length}`}
        >
          {current.map((node, i) => (
            <React.Fragment key={i}>{node}</React.Fragment>
          ))}
        </StudioRegion>,
      );
      current = [];
      currentSectionId = undefined;
      currentSectionKey = undefined;
    }
  }

  function push(...nodes: React.ReactNode[]) {
    current.push(...nodes);
  }

  function addTocHeader(textJa: string, textEn: string = "") {
    if (!textJa) return;
    const baseId = tocId(textJa);
    const occurrence = tocOccurrences.get(baseId) ?? 0;
    tocOccurrences.set(baseId, occurrence + 1);
    const id = tocId(textJa, occurrence);
    if (currentTocLevel !== "hidden") {
      tocEntries.push({
        id,
        text: textJa,
        subtext: textEn || undefined,
        level: currentTocLevel,
      });
    }
    currentSectionId = id;
    current.push(
      <SectionHeader
        text={textJa}
        textEn={textEn}
        variant={currentTocLevel === "subsection" ? "subsection" : "plain"}
        level={currentTocLevel === "subsection" ? 3 : 2}
      />,
    );
  }

  const ctx = { push, flush, addTocHeader };

  for (const sec of sections) {
    flush(); // flush previous section's content before starting a new one
    currentSectionKey = sec._key; // track key so studioId matches SectionEditor's setFocus call
    currentTocLevel = normalizeTocLevel(sec.tocLevel);
    const handler = sectionHandlers[sec._type];
    if (handler) handler(sec, ctx);
  }

  // Flush any remaining content
  flush();

  return {
    groups: <>{groups}</>,
    tocEntries,
  };
}

function normalizeTocLevel(value: TocLevel | undefined): TocLevel {
  if (value === "subsection" || value === "hidden") return value;
  return "section";
}
