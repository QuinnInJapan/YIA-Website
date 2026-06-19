import type { TableSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import ComparisonTable from "@/components/ComparisonTable";
import ScheduleDirectory from "@/components/ScheduleDirectory";
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
  if (s.display === "comparisonTable") {
    ctx.push(<ComparisonTable columns={s.columns} rows={s.rows ?? []} />);
    ctx.flush();
    return;
  }
  if (s.display === "scheduleDirectory") {
    ctx.push(<ScheduleDirectory columns={s.columns} rows={s.rows ?? []} />);
    ctx.flush();
    return;
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
