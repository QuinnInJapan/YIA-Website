import Image from "next/image";
import { resolveImage } from "@/lib/images";
import type { SisterCity } from "@/lib/types";

interface SisterCityCardsProps {
  cities: SisterCity[];
}

export default function SisterCityCards({ cities }: SisterCityCardsProps) {
  return (
    <div className="sister-city-showcase">
      {cities.map((c, i) => {
        const img = c.image ? resolveImage(c.image) : "";
        const flip = i % 2 === 1 ? " sister-city-row--flip" : "";
        return (
          <div className={`sister-city-row${flip}`} key={i}>
            <div className="sister-city-row__photo">
              {img && (
                <Image
                  src={img}
                  alt={c.nameEn || c.nameJa}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="sister-city-row__img"
                />
              )}
            </div>
            <div className="sister-city-row__info">
              <div className="sister-city-row__country">{c.country}</div>
              <div className="sister-city-row__name">{c.nameEn}</div>
              <div className="sister-city-row__name-ja">{c.nameJa}</div>
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
