import { ja, en } from "@/lib/i18n";
import type { I18nString } from "@/lib/i18n";

interface FeeRow {
  memberType: I18nString;
  fee: I18nString;
}

interface FeeTableProps {
  rows: FeeRow[];
}

export default function FeeTable({ rows }: FeeTableProps) {
  return (
    <table className="fee-table">
      <thead>
        <tr>
          <th scope="col">会員種別 Membership Type</th>
          <th scope="col">年会費 Annual Fee</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>
              {ja(r.memberType)} {en(r.memberType)}
            </td>
            <td>{ja(r.fee)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
