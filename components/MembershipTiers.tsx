import { ja, en } from "@/lib/i18n";
import type { I18nString } from "@/lib/i18n";

interface TierRow {
  memberType: I18nString;
  fee: I18nString;
  description?: I18nString;
}

interface MembershipTiersProps {
  rows: TierRow[];
}

function NameWithParens({ text }: { text: string }) {
  const match = text.match(/^(.+?)([（(].+[）)])$/);
  if (!match) return <>{text}</>;
  return <>{match[1]}<br /><span className="membership-table__parens">{match[2]}</span></>;
}

export default function MembershipTiers({ rows }: MembershipTiersProps) {
  return (
    <div className="membership-tables">
      <table className="membership-table">
        <thead>
          <tr>
            <th scope="col">会員種別</th>
            <th scope="col">対象</th>
            <th scope="col">年会費</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="membership-table__name"><NameWithParens text={ja(r.memberType)} /></td>
              <td className="membership-table__desc">{r.description && ja(r.description)}</td>
              <td className="membership-table__fee">{ja(r.fee)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="membership-table" lang="en" translate="no">
        <thead>
          <tr>
            <th scope="col">Type</th>
            <th scope="col">Eligibility</th>
            <th scope="col">Annual Fee</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="membership-table__name"><NameWithParens text={en(r.memberType)} /></td>
              <td className="membership-table__desc">{r.description && en(r.description)}</td>
              <td className="membership-table__fee">{en(r.fee)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
