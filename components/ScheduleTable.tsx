import React from "react";
import type { GroupScheduleRow } from "@/lib/types";

interface ScheduleTableProps {
  columns: string[];
  columnsEn?: string[];
  rows: (string[] | GroupScheduleRow)[];
  type?: string;
}

const slotLabels: Record<string, string> = {
  morning: "午前 Morning",
  afternoon: "午後 Afternoon",
  evening: "夜間 Evening",
  weekend: "週末 Weekend",
};

function GroupRow({ r }: { r: GroupScheduleRow }) {
  let nameContent: React.ReactNode;
  if (r.schedule_pdf) {
    nameContent = <a href={r.schedule_pdf}>{r.name}</a>;
  } else if (r.website) {
    nameContent = (
      <a href={r.website} target="_blank" rel="noopener noreferrer">
        {r.name}
      </a>
    );
  } else {
    nameContent = r.name;
  }

  return (
    <tr>
      <td>
        {nameContent}
        {r.photos_pdf && (
          <>
            {" "}
            <a href={r.photos_pdf} className="schedule-table__photo-link">
              📷
            </a>
          </>
        )}
        {r.website && r.schedule_pdf && (
          <>
            {" "}
            <a
              href={r.website}
              target="_blank"
              rel="noopener noreferrer"
              className="schedule-table__web-link"
            >
              🌐
            </a>
          </>
        )}
        {r.nameEn && (
          <>
            <br />
            <span className="schedule-table__en">{r.nameEn}</span>
          </>
        )}
      </td>
      <td>{r.day}</td>
      <td>{r.time}</td>
      <td>{r.location}</td>
    </tr>
  );
}

export default function ScheduleTable({
  columns,
  columnsEn,
  rows,
  type,
}: ScheduleTableProps) {
  const headers = columns.map((c, i) => (
    <th key={i}>
      {c}
      {columnsEn?.[i] ? ` ${columnsEn[i]}` : ""}
    </th>
  ));

  let bodyRows: React.ReactNode;

  if (type === "group") {
    const groupRows = rows as GroupScheduleRow[];
    const hasSlots = groupRows.some((r) => r.timeSlot);

    if (hasSlots) {
      const slotOrder = ["morning", "afternoon", "evening", "weekend"];
      const grouped: Record<string, GroupScheduleRow[]> = {};
      for (const r of groupRows) {
        const slot = r.timeSlot || "_none";
        if (!grouped[slot]) grouped[slot] = [];
        grouped[slot].push(r);
      }
      bodyRows = (
        <>
          {slotOrder.map((slot) =>
            grouped[slot] ? (
              <React.Fragment key={slot}>
                <tr className="schedule-table__slot-header">
                  <td colSpan={columns.length}>
                    {slotLabels[slot] || slot}
                  </td>
                </tr>
                {grouped[slot].map((r, i) => (
                  <GroupRow r={r} key={`${slot}-${i}`} />
                ))}
              </React.Fragment>
            ) : null
          )}
          {grouped._none?.map((r, i) => (
            <GroupRow r={r} key={`none-${i}`} />
          ))}
        </>
      );
    } else {
      bodyRows = groupRows.map((r, i) => <GroupRow r={r} key={i} />);
    }
  } else {
    bodyRows = (rows as string[][]).map((r, i) => {
      const cells = Array.isArray(r) ? r : Object.values(r);
      return (
        <tr key={i}>
          {cells.map((v, j) => (
            <td key={j}>{String(v)}</td>
          ))}
        </tr>
      );
    });
  }

  return (
    <table className="schedule-table">
      <thead>
        <tr>{headers}</tr>
      </thead>
      <tbody>{bodyRows}</tbody>
    </table>
  );
}
