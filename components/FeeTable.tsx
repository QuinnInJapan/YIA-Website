interface FeeRow {
  typeJa: string;
  typeEn?: string;
  fee: string;
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
              {r.typeJa} {r.typeEn}
            </td>
            <td>{r.fee}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
