import type { TableSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import SectionTable from "@/components/SectionTable";
import BilingualBlock from "@/components/BilingualBlock";

export const table: SectionHandler<TableSection> = (s, ctx) => {
  if (!s.columns?.length) {
    ctx.flush();
    return;
  }
  if (s.title) {
    ctx.addTocHeader(ja(s.title), en(s.title));
  }
  if (s.caption) {
    ctx.push(<BilingualBlock ja={ja(s.caption)} en={en(s.caption)} />);
  }
  ctx.push(<SectionTable columns={s.columns} rows={s.rows ?? []} />);
  ctx.flush();
};
