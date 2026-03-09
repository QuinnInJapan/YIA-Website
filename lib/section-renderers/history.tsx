import type { HistorySection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import BilingualPortableText from "@/components/BilingualPortableText";
import ScheduleTable from "@/components/ScheduleTable";

export const history: SectionHandler<HistorySection> = (s, ctx) => {
  ctx.addTocHeader(ja(s.title), en(s.title));
  if (s.intro) {
    ctx.push(<BilingualPortableText field={s.intro} />);
  }
  if (s.years?.length) {
    const rows = s.years.map((y) => [y.year, y.cuisines]);
    ctx.push(
      <ScheduleTable
        columns={s.columns || ["年度", "料理"]}
        columnsEn={s.columnsEn || ["Year", "Cuisines"]}
        rows={rows}
      />
    );
  }
  ctx.flush();
};
