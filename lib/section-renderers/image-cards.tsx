import type { ImageCardsSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import SisterCityCards from "@/components/SisterCityCards";

export const imageCards: SectionHandler<ImageCardsSection> = (s, ctx) => {
  if (!s.items) {
    ctx.flush();
    return;
  }
  if (s.title) {
    ctx.addTocHeader(ja(s.title), en(s.title));
  }
  ctx.push(<SisterCityCards cities={s.items} />);
  ctx.flush();
};
