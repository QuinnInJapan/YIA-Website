import type { FlyersSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import EventFlyerPairWrapper from "@/components/EventFlyerPairWrapper";

export const flyers: SectionHandler<FlyersSection> = (s, ctx) => {
  if (!s.items) {
    ctx.flush();
    return;
  }
  ctx.push(<EventFlyerPairWrapper flyers={s.items} />);
  ctx.flush();
};
