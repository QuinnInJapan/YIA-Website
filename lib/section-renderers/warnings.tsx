import type { WarningsSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import Callout from "@/components/Callout";

export const warnings: SectionHandler<WarningsSection> = (s, ctx) => {
  if (!s.items) {
    ctx.flush();
    return;
  }
  for (const w of s.items) {
    ctx.push(<Callout field={w.value} variant="warning" />);
  }
  ctx.flush();
};
