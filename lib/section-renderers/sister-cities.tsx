import type { SisterCitiesSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import SisterCityCards from "@/components/SisterCityCards";

export const sisterCities: SectionHandler<SisterCitiesSection> = (s, ctx) => {
  ctx.addTocHeader(ja(s.title), en(s.title));
  ctx.push(<SisterCityCards cities={s.cities} />);
  ctx.flush();
};
