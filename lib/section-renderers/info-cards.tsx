import type { InfoCardsSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import DefinitionCard from "@/components/DefinitionCard";

export const infoCards: SectionHandler<InfoCardsSection> = (s, ctx) => {
  if (!s.items) {
    ctx.flush();
    return;
  }
  if (s.title && !s.hideTitle) {
    ctx.addTocHeader(ja(s.title), en(s.title));
  }
  for (const def of s.items) {
    ctx.push(<DefinitionCard term={def.term} definition={def.definition} />);
  }
  ctx.flush();
};
