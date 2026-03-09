import type { FairTradeSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import BilingualPortableText from "@/components/BilingualPortableText";
import ScheduleTable from "@/components/ScheduleTable";

export const fairTrade: SectionHandler<FairTradeSection> = (s, ctx) => {
  ctx.addTocHeader(ja(s.title), en(s.title));
  if (s.description) {
    ctx.push(<BilingualPortableText field={s.description} />);
  }
  if (s.priceList) {
    const rows = s.priceList.map((p) => [p.type, p.weight, p.price]);
    ctx.push(
      <ScheduleTable
        columns={["タイプ", "容量", "価格"]}
        columnsEn={["Type", "Weight", "Price"]}
        rows={rows}
      />
    );
  }
  if (s.delivery) {
    ctx.push(<BilingualPortableText field={s.delivery} />);
  }
  ctx.flush();
};
