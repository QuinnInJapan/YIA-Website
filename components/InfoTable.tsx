import type { InfoRow } from "@/lib/types";
import { ja, en } from "@/lib/i18n";
import { Nl2br } from "@/lib/helpers";

interface InfoTableProps {
  rows: InfoRow[];
  /** Render as an emphasised bordered card (e.g. ご利用案内 key-facts blocks). */
  prominent?: boolean;
}

export default function InfoTable({ rows, prominent }: InfoTableProps) {
  return (
    <dl className={`info-dl${prominent ? " info-dl--card" : ""}`}>
      {rows.map((r, i) => {
        return (
          <div className="info-dl__row" key={i}>
            <dt>
              {ja(r.label)}
              {en(r.label) && (
                <span className="info-dl__label-en" lang="en" translate="no">
                  {" "}
                  {en(r.label)}
                </span>
              )}
            </dt>
            <dd>
              <Nl2br text={ja(r.value)} />
              {en(r.value) && (
                <>
                  <br />
                  <span className="info-dl__value-en" lang="en" translate="no">
                    <Nl2br text={en(r.value)} />
                  </span>
                </>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
