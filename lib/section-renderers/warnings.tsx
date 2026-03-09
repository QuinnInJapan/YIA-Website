import type { WarningsSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import Callout from "@/components/Callout";

export const warnings: SectionHandler<WarningsSection> = (s, ctx) => {
  for (const w of s.items) {
    ctx.push(<Callout field={w} variant="warning" />);
  }
  ctx.flush();
};
