"use client";

import { TextInput } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import { BilingualInput } from "../../shared/BilingualInput";
import { BilingualTextarea } from "../../shared/BilingualTextarea";
import type { SectionItem } from "../types";

interface YearEntry {
  _key: string;
  year?: string;
  cuisines?: string;
}

export function HistorySectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  const columns = (section.columns as string[]) ?? [];
  const columnsEn = (section.columnsEn as string[]) ?? [];
  const years = (section.years as YearEntry[]) ?? [];

  return (
    <>
      <BilingualInput
        label="タイトル"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />
      <BilingualTextarea
        label="紹介文"
        value={section.intro as { _key: string; value: string }[] | null}
        onChange={(val) => onUpdateField("intro", val)}
        rows={2}
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

      {/* Year entries */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
          年度一覧
        </div>
        {years.map((entry, i) => (
          <div
            key={entry._key}
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 6,
              alignItems: "center",
            }}
          >
            <TextInput
              fontSize={0}
              placeholder="年度"
              value={entry.year ?? ""}
              style={{ width: 80 }}
              onChange={(e) => {
                const updated = [...years];
                updated[i] = { ...updated[i], year: e.currentTarget.value };
                onUpdateField("years", updated);
              }}
            />
            <TextInput
              fontSize={0}
              placeholder="内容"
              value={entry.cuisines ?? ""}
              style={{ flex: 1 }}
              onChange={(e) => {
                const updated = [...years];
                updated[i] = { ...updated[i], cuisines: e.currentTarget.value };
                onUpdateField("years", updated);
              }}
            />
            <button
              type="button"
              onClick={() =>
                onUpdateField(
                  "years",
                  years.filter((_, idx) => idx !== i),
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
        ))}
        <button
          type="button"
          onClick={() =>
            onUpdateField("years", [
              ...years,
              { _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12), year: "", cuisines: "" },
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
          + 年度を追加
        </button>
      </div>
    </>
  );
}
