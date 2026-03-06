import Image from "next/image";
import { imageUrl } from "@/lib/sanity/image";
import { ja, en } from "@/lib/i18n";
import type { SisterCity } from "@/lib/types";

interface SisterCityCardsProps {
  cities: SisterCity[];
}

export default function SisterCityCards({ cities }: SisterCityCardsProps) {
  return (
    <div className="sister-city-showcase">
      {cities.map((c, i) => {
        const img = imageUrl(c.image);
        const flip = i % 2 === 1 ? " sister-city-row--flip" : "";
        return (
          <div className={`sister-city-row${flip}`} key={i}>
            <div className="sister-city-row__photo">
              {img && (
                <Image
                  src={img}
                  alt={en(c.name) || ja(c.name)}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="sister-city-row__img"
                />
              )}
            </div>
            <div className="sister-city-row__info">
              <div className="sister-city-row__country">
                {typeof c.country === "string" ? c.country : en(c.country)}
              </div>
              <div className="sister-city-row__name">{en(c.name)}</div>
              <div className="sister-city-row__name-ja">{ja(c.name)}</div>
              {c.note && (
                <div className="sister-city-row__note">{c.note}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
