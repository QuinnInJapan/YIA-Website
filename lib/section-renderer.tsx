import React from "react";
import { stegaClean } from "next-sanity";
import type {
  PageSection,
  WarningsSection,
  ContentSection,
  InfoTableSection,
  TableScheduleSection,
  GroupScheduleSection,
  EventScheduleSection,
  GallerySection,
  SisterCitiesSection,
  DefinitionsSection,
  LinksSection,
  HistorySection,
  FairTradeSection,
  FlyersSection,
  BoardMembersSection,
  FeeTableSection,
  DirectoryListSection,
  ImageFile,
} from "@/lib/types";
import { tocId } from "@/lib/helpers";
import type { I18nString } from "@/lib/i18n";
import { ja, en } from "@/lib/i18n";
import { formatDateJa, formatDateEn } from "@/lib/date-format";
import { imageUrl, resolveDocs, fileUrl } from "@/lib/sanity/image";

import SectionHeader from "@/components/SectionHeader";
import InfoTable from "@/components/InfoTable";
import Checklist from "@/components/Checklist";
import ScheduleTable from "@/components/ScheduleTable";
import DocList from "@/components/DocList";
import BilingualBlock from "@/components/BilingualBlock";
import BilingualPortableText from "@/components/BilingualPortableText";
import Callout from "@/components/Callout";
import SisterCityCards from "@/components/SisterCityCards";
import DefinitionCard from "@/components/DefinitionCard";
import ResourceLink from "@/components/ResourceLink";
import PhotoGalleryWrapper from "@/components/PhotoGalleryWrapper";
import EventFlyerPairWrapper from "@/components/EventFlyerPairWrapper";
import BoardMembers from "@/components/BoardMembers";
import FeeTable from "@/components/FeeTable";
import DirectoryList from "@/components/DirectoryList";

export interface TocEntry {
  id: string;
  textJa: string;
  textEn: string;
}

interface SectionBuilderResult {
  groups: React.ReactNode;
  tocEntries: TocEntry[];
}

// Helper to build gallery images from Sanity image objects
function buildGalleryImages(images: ImageFile[]) {
  return images
    .filter((img) => img.file?.asset?._ref)
    .map((img) => ({
      src: imageUrl(img.file),
      alt: ja(img.caption) || "",
      captionJa: ja(img.caption),
      captionEn: en(img.caption),
    }));
}

export function renderSections(sections: PageSection[]): SectionBuilderResult {
  const groups: React.ReactNode[] = [];
  let current: React.ReactNode[] = [];
  const tocEntries: TocEntry[] = [];

  let currentSectionId: string | undefined;

  function flush() {
    if (current.length) {
      groups.push(
        <div className="page-section" id={currentSectionId} key={`section-${groups.length}`}>
          {current.map((node, i) => (
            <React.Fragment key={i}>{node}</React.Fragment>
          ))}
        </div>
      );
      current = [];
      currentSectionId = undefined;
    }
  }

  function addTocHeader(textJa: string, textEn: string = "") {
    if (!textJa) return;
    const id = tocId(textJa);
    tocEntries.push({ id, textJa, textEn });
    currentSectionId = id;
    current.push(
      <SectionHeader
        text={textJa}
        textEn={textEn}
        variant="plain"
        level={2}
      />
    );
  }

  for (const sec of sections) {
    switch (sec._type) {
      case "warnings": {
        const s = sec as WarningsSection;
        for (const w of s.items) {
          current.push(<Callout field={w} variant="warning" />);
        }
        flush();
        break;
      }

      case "content": {
        const s = sec as ContentSection;
        if (ja(s.title)) {
          addTocHeader(ja(s.title), en(s.title));
        }
        if (s.description) {
          current.push(<BilingualPortableText field={s.description} />);
        }
        if (s.infoTable) {
          current.push(<InfoTable rows={s.infoTable} />);
        }
        if (s.checklist) {
          current.push(<Checklist items={s.checklist} />);
        }
        if (s.documents?.length) {
          current.push(<DocList docs={resolveDocs(s.documents)} />);
        }
        if (s.note) {
          current.push(<Callout field={s.note} notePrefix="※ " />);
        }
        if (s.images?.length) {
          const galleryImages = buildGalleryImages(s.images);
          if (galleryImages.length) {
            current.push(<PhotoGalleryWrapper images={galleryImages} />);
          }
        }
        flush();
        break;
      }

      case "infoTable": {
        const s = sec as InfoTableSection;
        addTocHeader(ja(s.title), en(s.title));
        const infoRows = s.rows.map((row) => {
          if (s.appointmentNote && ja(row.label) === "予約") {
            return {
              ...row,
              value: [
                { _key: "ja", value: `${ja(row.value)}\n${ja(s.appointmentNote)}` },
                { _key: "en", value: `${en(row.value)}\n${en(s.appointmentNote)}` },
              ],
            };
          }
          if (s.additionalLanguageNote && ja(row.label) === "対応言語") {
            return {
              ...row,
              value: [
                { _key: "ja", value: `${ja(row.value)}\n${ja(s.additionalLanguageNote)}` },
                { _key: "en", value: `${en(row.value)}\n${en(s.additionalLanguageNote)}` },
              ],
            };
          }
          return row;
        });
        current.push(<InfoTable rows={infoRows} />);
        if (s.otherNotes) {
          current.push(
            <BilingualBlock ja={ja(s.otherNotes)} en={en(s.otherNotes)} />
          );
        }
        flush();
        break;
      }

      case "tableSchedule": {
        const s = sec as TableScheduleSection;
        addTocHeader(ja(s.title), en(s.title));
        let rows: { ja: string; en: string }[][] = [];
        if (typeof s.rows === "string") {
          // Legacy: JSON string
          try {
            const parsed: string[][] = JSON.parse(stegaClean(s.rows));
            rows = parsed.map((r) => r.map((v) => ({ ja: v, en: "" })));
          } catch { rows = []; }
        } else if (Array.isArray(s.rows)) {
          rows = s.rows.map((r) => {
            if (typeof r === "object" && "cells" in r) {
              const cells = (r as { cells: ({ text: I18nString } | I18nString | string)[] }).cells || [];
              return cells.map((c) => {
                if (typeof c === "string") return { ja: c, en: "" };
                // New shape: { text: I18nString }
                if ("text" in c) return { ja: ja(c.text), en: en(c.text) };
                // Legacy i18n array directly
                return { ja: ja(c as I18nString), en: en(c as I18nString) };
              });
            }
            // Legacy string[][]
            return (r as string[]).map((v) => ({ ja: String(v), en: "" }));
          });
        }
        current.push(
          <ScheduleTable
            columns={s.columns || []}
            columnsEn={s.columnsEn}
            rows={rows}
          />
        );
        flush();
        break;
      }

      case "groupSchedule": {
        const s = sec as GroupScheduleSection;
        addTocHeader(ja(s.title), en(s.title));
        current.push(
          <ScheduleTable
            columns={s.columns || []}
            columnsEn={s.columnsEn}
            rows={s.groups || []}
            type="group"
          />
        );
        flush();
        break;
      }

      case "eventSchedule": {
        const s = sec as EventScheduleSection;
        addTocHeader(ja(s.title), en(s.title));
        if (s.entries) {
          const rows = s.entries.map((entry) => {
            const cells: string[] = [formatDateJa(entry.date)];
            if (entry.time) cells.push(entry.time);
            if (ja(entry.location)) cells.push(ja(entry.location));
            if (ja(entry.description)) cells.push(ja(entry.description));
            return cells;
          });
          const cols = ["日付 Date"];
          if (s.entries[0]?.time) cols.push("時間 Time");
          if (ja(s.entries[0]?.location)) cols.push("場所 Location");
          if (ja(s.entries[0]?.description)) cols.push("内容 Description");
          current.push(<ScheduleTable columns={cols} rows={rows} />);
        } else if (s.entry) {
          const infoRows = [
            {
              label: [{ _key: "ja", value: "日時" }, { _key: "en", value: "Date" }],
              value: [
                { _key: "ja", value: s.entry.time ? `${formatDateJa(s.entry.date)} ${s.entry.time}` : formatDateJa(s.entry.date) },
                { _key: "en", value: formatDateEn(s.entry.date) },
              ],
            },
          ];
          if (s.venue) {
            infoRows.push({
              label: [{ _key: "ja", value: "会場" }, { _key: "en", value: "Venue" }],
              value: [
                { _key: "ja", value: ja(s.venue.location) },
                { _key: "en", value: en(s.venue.location) },
              ],
            });
          }
          current.push(<InfoTable rows={infoRows} />);
        }
        flush();
        break;
      }

      case "gallery": {
        const s = sec as GallerySection;
        const galleryImages = buildGalleryImages(s.images);
        if (galleryImages.length) {
          current.push(<PhotoGalleryWrapper images={galleryImages} />);
          flush();
        }
        break;
      }

      case "sisterCities": {
        const s = sec as SisterCitiesSection;
        addTocHeader(ja(s.title), en(s.title));
        current.push(<SisterCityCards cities={s.cities} />);
        flush();
        break;
      }

      case "definitions": {
        const s = sec as DefinitionsSection;
        addTocHeader(ja(s.title), en(s.title));
        for (const def of s.items) {
          current.push(<DefinitionCard term={def.term} definition={def.definition} />);
        }
        flush();
        break;
      }

      case "links": {
        const s = sec as LinksSection;
        addTocHeader(ja(s.title), en(s.title));
        const docItems = s.items.filter((it) => it.type !== "youtube");
        const ytItems = s.items.filter((it) => it.type === "youtube");
        if (docItems.length) {
          current.push(
            <DocList
              docs={docItems.map((it) => ({
                label: it.label,
                url: fileUrl(it.file) || it.url,
                type: it.fileType,
              }))}
            />
          );
        }
        for (const res of ytItems) {
          current.push(
            <ResourceLink
              type="youtube"
              url={res.url || ""}
              titleJa={ja(res.label)}
              titleEn={en(res.label)}
            />
          );
        }
        flush();
        break;
      }

      case "history": {
        const s = sec as HistorySection;
        addTocHeader(ja(s.title), en(s.title));
        if (s.intro) {
          current.push(<BilingualPortableText field={s.intro} />);
        }
        if (s.years?.length) {
          const rows = s.years.map((y) => [y.year, y.cuisines]);
          current.push(
            <ScheduleTable
              columns={s.columns || ["年度", "料理"]}
              columnsEn={s.columnsEn || ["Year", "Cuisines"]}
              rows={rows}
            />
          );
        }
        flush();
        break;
      }

      case "fairTrade": {
        const s = sec as FairTradeSection;
        addTocHeader(ja(s.title), en(s.title));
        if (s.description) {
          current.push(<BilingualPortableText field={s.description} />);
        }
        if (s.priceList) {
          const rows = s.priceList.map((p) => [p.type, p.weight, p.price]);
          current.push(
            <ScheduleTable
              columns={["タイプ", "容量", "価格"]}
              columnsEn={["Type", "Weight", "Price"]}
              rows={rows}
            />
          );
        }
        if (s.delivery) {
          current.push(<BilingualPortableText field={s.delivery} />);
        }
        flush();
        break;
      }

      case "flyers": {
        const s = sec as FlyersSection;
        current.push(<EventFlyerPairWrapper flyers={s.items} />);
        flush();
        break;
      }

      case "boardMembers": {
        const s = sec as BoardMembersSection;
        addTocHeader(ja(s.title), en(s.title));
        current.push(
          <BoardMembers board={{ asOf: s.asOf, members: s.members }} />
        );
        flush();
        break;
      }

      case "feeTable": {
        const s = sec as FeeTableSection;
        addTocHeader(ja(s.title), en(s.title));
        current.push(<FeeTable rows={s.rows} />);
        flush();
        break;
      }

      case "directoryList": {
        const s = sec as DirectoryListSection;
        addTocHeader(ja(s.title), en(s.title));
        current.push(<DirectoryList entries={s.entries} />);
        flush();
        break;
      }
    }
  }

  // Flush any remaining content
  flush();

  return {
    groups: <>{groups}</>,
    tocEntries,
  };
}
