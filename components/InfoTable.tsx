import type { InfoRow } from "@/lib/types";
import { Nl2br } from "@/lib/helpers";

interface InfoTableProps {
  rows: InfoRow[];
}

export default function InfoTable({ rows }: InfoTableProps) {
  return (
    <dl className="info-dl">
      {rows.map((r, i) => {
        const wide =
          (r.valueJa || "").length > 80 ? " info-dl__row--wide" : "";
        return (
          <div className={`info-dl__row${wide}`} key={i}>
            <dt>
              {r.labelJa}
              {r.labelEn && (
                <span className="info-dl__label-en"> {r.labelEn}</span>
              )}
            </dt>
            <dd>
              <Nl2br text={r.valueJa} />
              {r.valueEn && (
                <>
                  <br />
                  <span className="info-dl__value-en">
                    <Nl2br text={r.valueEn} />
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
