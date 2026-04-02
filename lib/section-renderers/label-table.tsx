import type { LabelTableSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import InfoTable from "@/components/InfoTable";

export const labelTable: SectionHandler<LabelTableSection> = (s, ctx) => {
  if (!s.rows) {
    ctx.flush();
    return;
  }
  if (s.title && !s.hideTitle) {
    ctx.addTocHeader(ja(s.title), en(s.title));
  }
  ctx.push(<InfoTable rows={s.rows} />);
  ctx.flush();
};
