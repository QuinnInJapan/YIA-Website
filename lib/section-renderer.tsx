import React from "react";
import type {
  ProgramSection,
  WarningsSection,
  ContentSection,
  InfoTableSection,
  OtherNotesSection,
  ScheduleSection,
  GallerySection,
  SisterCitiesSection,
  DefinitionsSection,
  ResourcesSection,
  HistorySection,
  FairTradeSection,
  FlyersSection,
  DocumentsSection,
  ImageFile,
} from "@/lib/types";
import { tocId } from "@/lib/helpers";
import { resolveImage, resolveImageLocal, getImageWidth, HERO_MIN_WIDTH } from "@/lib/images";
import path from "path";

import SectionHeader from "@/components/SectionHeader";
import InfoTable from "@/components/InfoTable";
import Checklist from "@/components/Checklist";
import ScheduleTable from "@/components/ScheduleTable";
import DocList from "@/components/DocList";
import BilingualBlock from "@/components/BilingualBlock";
import Callout from "@/components/Callout";
import SisterCityCards from "@/components/SisterCityCards";
import DefinitionCard from "@/components/DefinitionCard";
import ResourceLink from "@/components/ResourceLink";
import PhotoGalleryWrapper from "@/components/PhotoGalleryWrapper";
import EventFlyerPairWrapper from "@/components/EventFlyerPairWrapper";

export interface TocEntry {
  id: string;
  textJa: string;
  textEn: string;
}

interface SectionBuilderResult {
  groups: React.ReactNode;
  tocEntries: TocEntry[];
}

// Helper to build gallery images with width filtering
function buildGalleryImages(images: ImageFile[]) {
  const filtered = images.filter((img) => {
    const local = resolveImageLocal(img.file);
    const filePath = path.join(
      process.cwd(),
      "public",
      decodeURIComponent(local)
    );
    return getImageWidth(filePath) >= HERO_MIN_WIDTH;
  });
  return filtered.map((img) => ({
    src: resolveImage(img.file),
    alt: img.captionJa || img.file,
    captionJa: img.captionJa,
    captionEn: img.captionEn,
  }));
}

export function renderSections(sections: ProgramSection[]): SectionBuilderResult {
  const groups: React.ReactNode[] = [];
  let current: React.ReactNode[] = [];
  const tocEntries: TocEntry[] = [];

  function flush() {
    if (current.length) {
      groups.push(
        <div className="page-section" key={`section-${groups.length}`}>
          {current.map((node, i) => (
            <React.Fragment key={i}>{node}</React.Fragment>
          ))}
        </div>
      );
      current = [];
    }
  }

  function addTocHeader(textJa: string, textEn: string = "") {
    const id = tocId(textJa);
    tocEntries.push({ id, textJa, textEn });
    current.push(
      <SectionHeader
        text={textJa}
        textEn={textEn}
        variant="plain"
        level={2}
        id={id}
      />
    );
  }

  for (const sec of sections) {
    switch (sec._type) {
      case "warnings": {
        const s = sec as WarningsSection;
        for (const w of s.items) {
          current.push(<Callout ja={w.ja} en={w.en} variant="warning" />);
        }
        flush();
        break;
      }

      case "content": {
        const s = sec as ContentSection;
        addTocHeader(s.titleJa, s.titleEn || "");
        if (s.descriptionJa) {
          current.push(
            <BilingualBlock ja={s.descriptionJa} en={s.descriptionEn || ""} />
          );
        }
        if (s.infoTable) {
          current.push(<InfoTable rows={s.infoTable} />);
        }
        if (s.checklist) {
          current.push(<Checklist items={s.checklist} />);
        }
        if (s.documents?.length) {
          current.push(<DocList docs={s.documents} />);
        }
        if (s.noteJa) {
          current.push(
            <Callout ja={`※ ${s.noteJa}`} en={s.noteEn || ""} />
          );
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
        addTocHeader(s.titleJa, s.titleEn);
        const infoRows = s.rows.map((row) => {
          if (s.appointmentNote && row.labelJa === "予約") {
            return {
              ...row,
              valueJa: `${row.valueJa}\n${s.appointmentNote.ja}`,
              valueEn: `${row.valueEn || ""}\n${s.appointmentNote.en}`,
            };
          }
          if (s.additionalLanguageNote && row.labelJa === "対応言語") {
            return {
              ...row,
              valueJa: `${row.valueJa}\n${s.additionalLanguageNote.ja}`,
              valueEn: `${row.valueEn || ""}\n${s.additionalLanguageNote.en}`,
            };
          }
          return row;
        });
        current.push(<InfoTable rows={infoRows} />);
        if (s.otherNotes) {
          current.push(
            <BilingualBlock ja={s.otherNotes.ja} en={s.otherNotes.en} />
          );
        }
        flush();
        break;
      }

      case "otherNotes": {
        const s = sec as OtherNotesSection;
        current.push(<BilingualBlock ja={s.ja} en={s.en} />);
        flush();
        break;
      }

      case "schedule": {
        const s = sec as ScheduleSection;
        addTocHeader(s.titleJa, s.titleEn);
        if (s.subtype === "dated") {
          if (s.entries) {
            const rows = s.entries.map((entry) => {
              const cells: string[] = [entry.date];
              if (entry.time) cells.push(entry.time);
              if (entry.locationJa) cells.push(entry.locationJa);
              if (entry.descriptionJa) cells.push(entry.descriptionJa);
              return cells;
            });
            const cols = ["日付 Date"];
            if (s.entries[0]?.time) cols.push("時間 Time");
            if (s.entries[0]?.locationJa) cols.push("場所 Location");
            if (s.entries[0]?.descriptionJa) cols.push("内容 Description");
            current.push(<ScheduleTable columns={cols} rows={rows} />);
          } else if (s.entry) {
            const entry = s.entry;
            if (s.venue) {
              current.push(
                <InfoTable
                  rows={[
                    {
                      labelJa: "日時",
                      labelEn: "Date",
                      valueJa: entry.time
                        ? `${entry.date} ${entry.time}`
                        : entry.date,
                      valueEn: entry.dateEn || "",
                    },
                    {
                      labelJa: "会場",
                      labelEn: "Venue",
                      valueJa: s.venue.locationJa,
                      valueEn: s.venue.locationEn,
                    },
                  ]}
                />
              );
            } else {
              current.push(
                <InfoTable
                  rows={[
                    {
                      labelJa: "日時",
                      labelEn: "Date",
                      valueJa: entry.time
                        ? `${entry.date} ${entry.time}`
                        : entry.date,
                      valueEn: entry.dateEn || "",
                    },
                  ]}
                />
              );
            }
          }
        } else {
          // Sanity stores `type` as `scheduleType` to avoid reserved field name
          const sAny = s as unknown as Record<string, unknown>;
          const scheduleType = s.type || sAny.scheduleType as string | undefined;

          // Sanity may store group rows under `groupRows` instead of `rows`
          const sanityGroupRows = sAny.groupRows as typeof s.rows | undefined;

          // rows may be a JSON string (from Sanity) for string[][] schedules
          let scheduleRows = (scheduleType === "group" && sanityGroupRows?.length)
            ? sanityGroupRows
            : s.rows || [];
          if (typeof scheduleRows === "string") {
            try { scheduleRows = JSON.parse(scheduleRows); } catch { scheduleRows = []; }
          }

          current.push(
            <ScheduleTable
              columns={s.columns || []}
              columnsEn={s.columnsEn}
              rows={scheduleRows}
              type={scheduleType}
            />
          );
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
        addTocHeader(s.titleJa, s.titleEn);
        current.push(<SisterCityCards cities={s.cities} />);
        flush();
        break;
      }

      case "definitions": {
        const s = sec as DefinitionsSection;
        addTocHeader(s.titleJa, s.titleEn);
        for (const def of s.items) {
          current.push(<DefinitionCard {...def} />);
        }
        flush();
        break;
      }

      case "resources": {
        const s = sec as ResourcesSection;
        addTocHeader(s.titleJa, s.titleEn);
        for (const res of s.items) {
          current.push(<ResourceLink {...res} />);
        }
        flush();
        break;
      }

      case "history": {
        const s = sec as HistorySection;
        addTocHeader(s.titleJa, s.titleEn);
        if (s.introJa) {
          current.push(
            <BilingualBlock ja={s.introJa} en={s.introEn || ""} />
          );
        }
        if (s.years?.length) {
          const rows = s.years.map((y) => [y.year, y.cuisines]);
          current.push(
            <ScheduleTable
              columns={["年度", "料理"]}
              columnsEn={["Year", "Cuisines"]}
              rows={rows}
            />
          );
        }
        flush();
        break;
      }

      case "fairTrade": {
        const s = sec as FairTradeSection;
        addTocHeader(s.titleJa, s.titleEn);
        if (s.descriptionJa) {
          current.push(
            <BilingualBlock ja={s.descriptionJa} en={s.descriptionEn || ""} />
          );
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
        if (s.deliveryJa) {
          current.push(
            <InfoTable
              rows={[
                {
                  labelJa: "購入方法",
                  labelEn: "How to Buy",
                  valueJa: s.deliveryJa,
                  valueEn: s.deliveryEn || "",
                },
              ]}
            />
          );
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

      case "documents": {
        const s = sec as DocumentsSection;
        addTocHeader(s.titleJa, s.titleEn);
        current.push(<DocList docs={s.items} />);
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
