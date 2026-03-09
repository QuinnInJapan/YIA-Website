import type { DefinitionsSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import DefinitionCard from "@/components/DefinitionCard";

export const definitions: SectionHandler<DefinitionsSection> = (s, ctx) => {
  ctx.addTocHeader(ja(s.title), en(s.title));
  for (const def of s.items) {
    ctx.push(<DefinitionCard term={def.term} definition={def.definition} />);
  }
  ctx.flush();
};
