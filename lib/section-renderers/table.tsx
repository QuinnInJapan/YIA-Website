import type { TableSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import SectionTable from "@/components/SectionTable";
import ScheduleListTable from "@/components/ScheduleListTable";

export const table: SectionHandler<TableSection> = (s, ctx) => {
  if (!s.columns?.length) {
    ctx.flush();
    return;
  }
  if (s.title) {
    ctx.addTocHeader(ja(s.title), en(s.title));
  }
  ctx.push(
    s.display === "scheduleList" ? (
      <ScheduleListTable columns={s.columns} rows={s.rows ?? []} />
    ) : (
      <SectionTable columns={s.columns} rows={s.rows ?? []} />
    ),
  );
  ctx.flush();
};
