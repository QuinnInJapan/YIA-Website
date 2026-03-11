import type { FeeTableSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import FeeTable from "@/components/FeeTable";
import MembershipTiers from "@/components/MembershipTiers";

export const feeTable: SectionHandler<FeeTableSection> = (s, ctx) => {
  ctx.addTocHeader(ja(s.title), en(s.title));

  const hasDescriptions = s.rows.some((r) => r.description && (ja(r.description) || en(r.description)));

  if (hasDescriptions) {
    ctx.push(<MembershipTiers rows={s.rows} />);
  } else {
    ctx.push(<FeeTable rows={s.rows} />);
  }

  ctx.flush();
};
