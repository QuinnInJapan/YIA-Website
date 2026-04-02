"use client";

import React from "react";
import { stegaClean } from "next-sanity";
import { ja, en } from "@/lib/i18n";
import { fileUrl } from "@/lib/sanity/image";
import type { SanityFile } from "@/lib/types";
import type { I18nString } from "@/lib/i18n";
import PdfLink from "./PdfLink";

interface GroupScheduleRow {
  name: I18nString;
  day: string;
  time: string;
  location: string;
  timeSlot?: "morning" | "afternoon" | "evening" | "weekend";
  schedulePdf?: SanityFile;
  photosPdf?: SanityFile;
  website?: string;
}

const slotLabels: Record<string, string> = {
  morning: "午前 Morning",
  afternoon: "午後 Afternoon",
  evening: "夜間 Evening",
  weekend: "週末 Weekend",
};

const slotOrder = ["morning", "afternoon", "evening", "weekend"];

function GroupEntry({ group }: { group: GroupScheduleRow }) {
  const scheduleUrl = fileUrl(group.schedulePdf);
  const photosUrl = fileUrl(group.photosPdf);
  const websiteUrl = group.website ? stegaClean(group.website) : "";

  return (
    <div className="group-list__entry">
      <div className="group-list__main">
        <div className="group-list__name">
          {ja(group.name)}
          {en(group.name) && (
            <span className="group-list__name-en" lang="en" translate="no">
              {en(group.name)}
            </span>
          )}
        </div>
        <div className="group-list__meta">
          <span>{group.day}</span>
          <span>{group.time}</span>
          <span>{group.location}</span>
        </div>
      </div>
      {(scheduleUrl || websiteUrl || photosUrl) && (
        <div className="group-list__links">
          {scheduleUrl && (
            <PdfLink
              href={scheduleUrl}
              title={`${ja(group.name)} スケジュール`}
              className="group-list__link"
            >
              📄 予定表
            </PdfLink>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group-list__link"
              aria-label={`${ja(group.name)} website (opens in new tab)`}
            >
              🌐 Web
            </a>
          )}
          {photosUrl && (
            <PdfLink href={photosUrl} title={`${ja(group.name)} 写真`} className="group-list__link">
              📷 写真
            </PdfLink>
          )}
        </div>
      )}
    </div>
  );
}

interface GroupListProps {
  groups: GroupScheduleRow[];
}

export default function GroupList({ groups }: GroupListProps) {
  const hasSlots = groups.some((g) => g.timeSlot);

  if (!hasSlots) {
    return (
      <div className="group-list">
        {groups.map((g, i) => (
          <GroupEntry group={g} key={i} />
        ))}
      </div>
    );
  }

  const grouped: Record<string, GroupScheduleRow[]> = {};
  for (const g of groups) {
    const slot = stegaClean(g.timeSlot) || "_none";
    if (!grouped[slot]) grouped[slot] = [];
    grouped[slot].push(g);
  }

  return (
    <div className="group-list">
      {slotOrder.map((slot) =>
        grouped[slot] ? (
          <React.Fragment key={slot}>
            <div className="group-list__slot-header">{slotLabels[slot] || slot}</div>
            {grouped[slot].map((g, i) => (
              <GroupEntry group={g} key={`${slot}-${i}`} />
            ))}
          </React.Fragment>
        ) : null,
      )}
      {grouped._none?.map((g, i) => (
        <GroupEntry group={g} key={`none-${i}`} />
      ))}
    </div>
  );
}
