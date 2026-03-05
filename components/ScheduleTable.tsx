import React from "react";
import { stegaClean } from "next-sanity";
import { ja, en } from "@/lib/i18n";
import { fileUrl } from "@/lib/sanity/image";
import type { GroupScheduleRow } from "@/lib/types";
import PdfLink from "./PdfLink";

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
  const scheduleUrl = fileUrl(r.schedulePdf);
  const photosUrl = fileUrl(r.photosPdf);
  const websiteUrl = r.website ? stegaClean(r.website) : "";

  let nameContent: React.ReactNode;
  if (scheduleUrl) {
    nameContent = <PdfLink href={scheduleUrl} title={ja(r.name)}>{ja(r.name)}</PdfLink>;
  } else if (websiteUrl) {
    nameContent = (
      <a href={websiteUrl} target="_blank" rel="noopener noreferrer" aria-label={`${ja(r.name)} (opens in new tab)`} className="external-link">
        {ja(r.name)}
      </a>
    );
  } else {
    nameContent = ja(r.name);
  }

  return (
    <tr>
      <td>
        {nameContent}
        {photosUrl && (
          <>
            {" "}
            <PdfLink href={photosUrl} title={`${ja(r.name)} 写真`} className="schedule-table__photo-link">
              📷
            </PdfLink>
          </>
        )}
        {websiteUrl && scheduleUrl && (
          <>
            {" "}
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="schedule-table__web-link"
              aria-label={`${ja(r.name)} website (opens in new tab)`}
            >
              🌐
            </a>
          </>
        )}
        {en(r.name) && (
          <>
            <br />
            <span className="schedule-table__en" lang="en">{en(r.name)}</span>
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
    <th key={i} scope="col">
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
      const cells = Array.isArray(r)
        ? r
        : Object.entries(r)
            .filter(([k]) => !k.startsWith("_"))
            .map(([, v]) => v);
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
