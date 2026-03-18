"use client";

import { TextInput } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import { BilingualInput } from "../../shared/BilingualInput";
import { BilingualTextarea } from "../../shared/BilingualTextarea";
import { KeyValueListEditor } from "../../shared/KeyValueListEditor";
import { i18nGet, i18nSet } from "../../shared/i18n";
import type { SectionItem } from "../types";

export function ContentSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  const infoTable =
    (section.infoTable as {
      _key: string;
      label?: { _key: string; value: string }[] | null;
      value?: { _key: string; value: string }[] | null;
    }[]) ?? [];
  const checklist =
    (section.checklist as {
      _key: string;
      label?: { _key: string; value: string }[] | null;
      note?: { _key: string; value: string }[] | null;
    }[]) ?? [];
  const schedule = (section.schedule as { _key: string; city?: string; period?: string }[]) ?? [];

  return (
    <>
      <BilingualInput
        label="タイトル"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />
      <BilingualTextarea
        label="説明"
        value={section.description as { _key: string; value: string }[] | null}
        onChange={(val) => onUpdateField("description", val)}
      />

      {/* Info table rows */}
      <KeyValueListEditor
        label="情報テーブル"
        labelHeader="ラベル"
        valueHeader="値"
        items={infoTable}
        onChange={(items) => onUpdateField("infoTable", items)}
      />

      {/* Checklist */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
          チェックリスト
        </div>
        {checklist.map((item, i) => (
          <div
            key={item._key}
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 6,
              alignItems: "start",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <TextInput
                  fontSize={0}
                  placeholder="ラベル（日）"
                  value={i18nGet(item.label, "ja")}
                  onChange={(e) => {
                    const updated = [...checklist];
                    updated[i] = {
                      ...updated[i],
                      label: i18nSet(item.label, "ja", e.currentTarget.value),
                    };
                    onUpdateField("checklist", updated);
                  }}
                />
                <TextInput
                  fontSize={0}
                  placeholder="Label (EN)"
                  value={i18nGet(item.label, "en")}
                  onChange={(e) => {
                    const updated = [...checklist];
                    updated[i] = {
                      ...updated[i],
                      label: i18nSet(item.label, "en", e.currentTarget.value),
                    };
                    onUpdateField("checklist", updated);
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <TextInput
                  fontSize={0}
                  placeholder="備考（日）"
                  value={i18nGet(item.note, "ja")}
                  onChange={(e) => {
                    const updated = [...checklist];
                    updated[i] = {
                      ...updated[i],
                      note: i18nSet(item.note, "ja", e.currentTarget.value),
                    };
                    onUpdateField("checklist", updated);
                  }}
                />
                <TextInput
                  fontSize={0}
                  placeholder="Note (EN)"
                  value={i18nGet(item.note, "en")}
                  onChange={(e) => {
                    const updated = [...checklist];
                    updated[i] = {
                      ...updated[i],
                      note: i18nSet(item.note, "en", e.currentTarget.value),
                    };
                    onUpdateField("checklist", updated);
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateField(
                  "checklist",
                  checklist.filter((_, idx) => idx !== i),
                )
              }
              style={{
                padding: 4,
                border: "none",
                background: "transparent",
                color: "var(--card-muted-fg-color)",
                cursor: "pointer",
                marginTop: 4,
              }}
            >
              <TrashIcon />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onUpdateField("checklist", [
              ...checklist,
              {
                _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
                label: [
                  { _key: "ja", value: "" },
                  { _key: "en", value: "" },
                ],
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
          + チェック項目を追加
        </button>
      </div>

      {/* Schedule */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
          スケジュール
        </div>
        {schedule.map((item, i) => (
          <div
            key={item._key}
            style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}
          >
            <TextInput
              fontSize={0}
              placeholder="都市"
              value={item.city ?? ""}
              onChange={(e) => {
                const updated = [...schedule];
                updated[i] = { ...updated[i], city: e.currentTarget.value };
                onUpdateField("schedule", updated);
              }}
            />
            <TextInput
              fontSize={0}
              placeholder="期間"
              value={item.period ?? ""}
              onChange={(e) => {
                const updated = [...schedule];
                updated[i] = { ...updated[i], period: e.currentTarget.value };
                onUpdateField("schedule", updated);
              }}
            />
            <button
              type="button"
              onClick={() =>
                onUpdateField(
                  "schedule",
                  schedule.filter((_, idx) => idx !== i),
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
            onUpdateField("schedule", [
              ...schedule,
              { _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12), city: "", period: "" },
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
          + スケジュールを追加
        </button>
      </div>

      <BilingualTextarea
        label="備考"
        value={section.note as { _key: string; value: string }[] | null}
        onChange={(val) => onUpdateField("note", val)}
        rows={2}
      />
    </>
  );
}
