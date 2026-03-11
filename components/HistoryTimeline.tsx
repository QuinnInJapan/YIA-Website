import React from "react";

interface HistoryEntry {
  year: string;
  cuisines: string;
}

interface HistoryTimelineProps {
  years: HistoryEntry[];
}

export default function HistoryTimeline({ years }: HistoryTimelineProps) {
  return (
    <div className="history-timeline">
      {years.map((entry, i) => (
        <div className="history-timeline__entry" key={i}>
          <div className="history-timeline__year">{entry.year}</div>
          <div className="history-timeline__cuisines">{entry.cuisines}</div>
        </div>
      ))}
    </div>
  );
}
