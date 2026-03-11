import { stegaClean } from "next-sanity";
import type {
  TableScheduleSection,
  GroupScheduleSection,
  EventScheduleSection,
  BilingualCell,
} from "@/lib/types";
import type { I18nString } from "@/lib/i18n";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import { formatDateJa, formatDateEn } from "@/lib/date-format";
import DataTable from "@/components/DataTable";
import GroupList from "@/components/GroupList";
import InfoTable from "@/components/InfoTable";

export const tableSchedule: SectionHandler<TableScheduleSection> = (s, ctx) => {
  ctx.addTocHeader(ja(s.title), en(s.title));
  let rows: BilingualCell[][] = [];
  if (typeof s.rows === "string") {
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
          if ("text" in c) return { ja: ja(c.text), en: en(c.text) };
          return { ja: ja(c as I18nString), en: en(c as I18nString) };
        });
      }
      return (r as string[]).map((v) => ({ ja: String(v), en: "" }));
    });
  }
  ctx.push(
    <DataTable
      columns={s.columns || []}
      columnsEn={s.columnsEn}
      rows={rows}
    />
  );
  ctx.flush();
};

export const groupSchedule: SectionHandler<GroupScheduleSection> = (s, ctx) => {
  ctx.addTocHeader(ja(s.title), en(s.title));
  ctx.push(<GroupList groups={s.groups || []} />);
  ctx.flush();
};

export const eventSchedule: SectionHandler<EventScheduleSection> = (s, ctx) => {
  ctx.addTocHeader(ja(s.title), en(s.title));
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
    ctx.push(<DataTable columns={cols} rows={rows} />);
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
    ctx.push(<InfoTable rows={infoRows} />);
  }
  ctx.flush();
};
