import type { FairTradeSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import BilingualPortableText from "@/components/BilingualPortableText";

export const fairTrade: SectionHandler<FairTradeSection> = (s, ctx) => {
  ctx.addTocHeader(ja(s.title), en(s.title));
  if (s.description) {
    ctx.push(<BilingualPortableText field={s.description} />);
  }
  if (s.priceList) {
    ctx.push(
      <dl className="info-dl">
        {s.priceList.map((p, i) => (
          <div className="info-dl__row" key={i}>
            <dt>
              {ja(p.type)}
              {en(p.type) && (
                <span className="info-dl__label-en" lang="en" translate="no">
                  {en(p.type)}
                </span>
              )}
            </dt>
            <dd>
              {ja(p.weight)} — {ja(p.price)}
              {(en(p.weight) || en(p.price)) && (
                <>
                  <br />
                  <span className="info-dl__value-en" lang="en" translate="no">
                    {en(p.weight)} — {en(p.price)}
                  </span>
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  if (s.delivery) {
    ctx.push(<BilingualPortableText field={s.delivery} />);
  }
  ctx.flush();
};
