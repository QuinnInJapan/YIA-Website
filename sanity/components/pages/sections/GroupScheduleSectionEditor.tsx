"use client";

import { TextInput } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import { BilingualInput } from "../../shared/BilingualInput";
import { i18nGet, i18nSet } from "../../shared/i18n";
import type { SectionItem } from "../types";

interface GroupRow {
  _key: string;
  _type?: string;
  name?: { _key: string; value: string }[] | null;
  day?: string;
  time?: string;
  location?: string;
  timeSlot?: string;
  website?: string;
}

export function GroupScheduleSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  const columns = (section.columns as string[]) ?? [];
  const columnsEn = (section.columnsEn as string[]) ?? [];
  const groups = (section.groups as GroupRow[]) ?? [];

  return (
    <>
      <BilingualInput
        label="タイトル"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />

      {/* Columns */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
          列名（日本語）
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {columns.map((col, i) => (
            <TextInput
              key={i}
              fontSize={0}
              value={col}
              style={{ width: 120 }}
              onChange={(e) => {
                const updated = [...columns];
                updated[i] = e.currentTarget.value;
                onUpdateField("columns", updated);
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => onUpdateField("columns", [...columns, ""])}
            style={{
              padding: "4px 8px",
              border: "1px dashed var(--card-border-color)",
              borderRadius: 4,
              background: "transparent",
              color: "var(--card-muted-fg-color)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
          列名（English）
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {columnsEn.map((col, i) => (
            <TextInput
              key={i}
              fontSize={0}
              value={col}
              style={{ width: 120 }}
              onChange={(e) => {
                const updated = [...columnsEn];
                updated[i] = e.currentTarget.value;
                onUpdateField("columnsEn", updated);
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => onUpdateField("columnsEn", [...columnsEn, ""])}
            style={{
              padding: "4px 8px",
              border: "1px dashed var(--card-border-color)",
              borderRadius: 4,
              background: "transparent",
              color: "var(--card-muted-fg-color)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Groups */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
          グループ一覧
        </div>
        {groups.map((group, i) => (
          <div
            key={group._key}
            style={{
              padding: "8px 10px",
              border: "1px solid var(--card-border-color)",
              borderRadius: 4,
              marginBottom: 6,
            }}
          >
            <div style={{ display: "flex", gap: 6, alignItems: "start", marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
                  名前（日/EN）
                </div>
                <TextInput
                  fontSize={0}
                  value={i18nGet(group.name, "ja")}
                  onChange={(e) => {
                    const updated = [...groups];
                    updated[i] = {
                      ...updated[i],
                      name: i18nSet(group.name, "ja", e.currentTarget.value),
                    };
                    onUpdateField("groups", updated);
                  }}
                />
                <TextInput
                  fontSize={0}
                  value={i18nGet(group.name, "en")}
                  onChange={(e) => {
                    const updated = [...groups];
                    updated[i] = {
                      ...updated[i],
                      name: i18nSet(group.name, "en", e.currentTarget.value),
                    };
                    onUpdateField("groups", updated);
                  }}
                  style={{ marginTop: 4 }}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateField(
                    "groups",
                    groups.filter((_, idx) => idx !== i),
                  )
                }
                style={{
                  padding: 4,
                  border: "none",
                  background: "transparent",
                  color: "var(--card-muted-fg-color)",
                  cursor: "pointer",
                }}
              >
                <TrashIcon />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
                  曜日
                </div>
                <TextInput
                  fontSize={0}
                  value={group.day ?? ""}
                  onChange={(e) => {
                    const updated = [...groups];
                    updated[i] = { ...updated[i], day: e.currentTarget.value };
                    onUpdateField("groups", updated);
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
                  時間
                </div>
                <TextInput
                  fontSize={0}
                  value={group.time ?? ""}
                  onChange={(e) => {
                    const updated = [...groups];
                    updated[i] = { ...updated[i], time: e.currentTarget.value };
                    onUpdateField("groups", updated);
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
                  場所
                </div>
                <TextInput
                  fontSize={0}
                  value={group.location ?? ""}
                  onChange={(e) => {
                    const updated = [...groups];
                    updated[i] = { ...updated[i], location: e.currentTarget.value };
                    onUpdateField("groups", updated);
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onUpdateField("groups", [
              ...groups,
              {
                _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
                _type: "groupScheduleRow",
                name: [
                  { _key: "ja", value: "" },
                  { _key: "en", value: "" },
                ],
                day: "",
                time: "",
                location: "",
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
          + グループを追加
        </button>
      </div>
    </>
  );
}
