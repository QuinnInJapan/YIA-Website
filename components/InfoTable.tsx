import type { InfoRow } from "@/lib/types";
import { ja, en } from "@/lib/i18n";
import { Nl2br } from "@/lib/helpers";

interface InfoTableProps {
  rows: InfoRow[];
}

export default function InfoTable({ rows }: InfoTableProps) {
  return (
    <dl className="info-dl">
      {rows.map((r, i) => {
        return (
          <div className="info-dl__row" key={i}>
            <dt>
              {ja(r.label)}
              {en(r.label) && (
                <span className="info-dl__label-en" lang="en"> {en(r.label)}</span>
              )}
            </dt>
            <dd>
              <Nl2br text={ja(r.value)} />
              {en(r.value) && (
                <>
                  <br />
                  <span className="info-dl__value-en" lang="en">
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
