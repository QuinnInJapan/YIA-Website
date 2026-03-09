import type { FeeTableSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import FeeTable from "@/components/FeeTable";

export const feeTable: SectionHandler<FeeTableSection> = (s, ctx) => {
  ctx.addTocHeader(ja(s.title), en(s.title));
  ctx.push(<FeeTable rows={s.rows} />);
  ctx.flush();
};
