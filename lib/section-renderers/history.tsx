import type { HistorySection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import BilingualPortableText from "@/components/BilingualPortableText";
import HistoryTimeline from "@/components/HistoryTimeline";

export const history: SectionHandler<HistorySection> = (s, ctx) => {
  ctx.addTocHeader(ja(s.title), en(s.title));
  if (s.intro) {
    ctx.push(<BilingualPortableText field={s.intro} />);
  }
  if (s.years?.length) {
    ctx.push(<HistoryTimeline years={s.years} />);
  }
  ctx.flush();
};
