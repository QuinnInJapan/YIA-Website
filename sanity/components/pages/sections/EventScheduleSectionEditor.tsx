"use client";

import { TextInput } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import { BilingualInput } from "../../shared/BilingualInput";
import { i18nGet, i18nSet } from "../../shared/i18n";
import type { SectionItem } from "../types";

interface ScheduleDateEntry {
  _key: string;
  _type?: string;
  date?: string;
  time?: string;
  location?: { _key: string; value: string }[] | null;
  description?: { _key: string; value: string }[] | null;
}

interface SingleEntry {
  date?: string;
  time?: string;
}

interface Venue {
  location?: { _key: string; value: string }[] | null;
}

export function EventScheduleSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  const entries = (section.entries as ScheduleDateEntry[]) ?? [];
  const entry = (section.entry as SingleEntry) ?? {};
  const venue = (section.venue as Venue) ?? {};

  return (
    <>
      <BilingualInput
        label="タイトル"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />

      {/* Multi-date entries */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
          複数回日程
        </div>
        {entries.map((item, i) => (
          <div
            key={item._key}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 1fr auto",
              gap: 6,
              marginBottom: 6,
              padding: "8px 10px",
              border: "1px solid var(--card-border-color)",
              borderRadius: 4,
              alignItems: "start",
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
                日付
              </div>
              <TextInput
                fontSize={0}
                type="date"
                value={item.date ?? ""}
                onChange={(e) => {
                  const updated = [...entries];
                  updated[i] = { ...updated[i], date: e.currentTarget.value };
                  onUpdateField("entries", updated);
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
                時間
              </div>
              <TextInput
                fontSize={0}
                placeholder="14:00〜16:00"
                value={item.time ?? ""}
                onChange={(e) => {
                  const updated = [...entries];
                  updated[i] = { ...updated[i], time: e.currentTarget.value };
                  onUpdateField("entries", updated);
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
                場所（日）
              </div>
              <TextInput
                fontSize={0}
                value={i18nGet(item.location, "ja")}
                onChange={(e) => {
                  const updated = [...entries];
                  updated[i] = {
                    ...updated[i],
                    location: i18nSet(item.location, "ja", e.currentTarget.value),
                  };
                  onUpdateField("entries", updated);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateField(
                  "entries",
                  entries.filter((_, idx) => idx !== i),
                )
              }
              style={{
                padding: 4,
                border: "none",
                background: "transparent",
                color: "var(--card-muted-fg-color)",
                cursor: "pointer",
                marginTop: 16,
              }}
            >
              <TrashIcon />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onUpdateField("entries", [
              ...entries,
              {
                _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
                _type: "scheduleDateEntry",
                date: "",
                time: "",
              },
            ])
          }
          style={{
            padding: "6px 12px",
            border: "1px dashed var(--card-border-color)",
            borderRadius: 4,
            background: "transparent",
            color: "var(--card-muted-fg-color)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          + 日程を追加
        </button>
      </div>

      {/* Single entry */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
          単発日程
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
              日付
            </div>
            <TextInput
              fontSize={0}
              type="date"
              value={entry.date ?? ""}
              onChange={(e) => onUpdateField("entry", { ...entry, date: e.currentTarget.value })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
              時間
            </div>
            <TextInput
              fontSize={0}
              placeholder="14:00〜16:00"
              value={entry.time ?? ""}
              onChange={(e) => onUpdateField("entry", { ...entry, time: e.currentTarget.value })}
            />
          </div>
        </div>
      </div>

      {/* Venue */}
      <BilingualInput
        label="会場"
        value={venue.location}
        onChange={(val) => onUpdateField("venue", { ...venue, location: val })}
      />
    </>
  );
}
