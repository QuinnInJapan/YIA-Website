"use client";

import { TrashIcon } from "@sanity/icons";
import { BilingualInput } from "../../shared/BilingualInput";
import { i18nGet, i18nSet } from "../../shared/i18n";
import { TextInput } from "@sanity/ui";
import type { SectionItem } from "../types";

interface FeeRow {
  _key: string;
  memberType?: { _key: string; value: string }[] | null;
  fee?: { _key: string; value: string }[] | null;
  description?: { _key: string; value: string }[] | null;
}

export function FeeTableSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  const rows = (section.rows as FeeRow[]) ?? [];

  return (
    <>
      <BilingualInput
        label="タイトル"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
          会費一覧
        </div>
        {rows.map((row, i) => (
          <div
            key={row._key}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 1fr auto",
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
                会員種別（日/EN）
              </div>
              <TextInput
                fontSize={0}
                value={i18nGet(row.memberType, "ja")}
                onChange={(e) => {
                  const updated = [...rows];
                  updated[i] = {
                    ...updated[i],
                    memberType: i18nSet(row.memberType, "ja", e.currentTarget.value),
                  };
                  onUpdateField("rows", updated);
                }}
              />
              <TextInput
                fontSize={0}
                value={i18nGet(row.memberType, "en")}
                placeholder="EN"
                onChange={(e) => {
                  const updated = [...rows];
                  updated[i] = {
                    ...updated[i],
                    memberType: i18nSet(row.memberType, "en", e.currentTarget.value),
                  };
                  onUpdateField("rows", updated);
                }}
                style={{ marginTop: 2 }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
                金額
              </div>
              <TextInput
                fontSize={0}
                value={i18nGet(row.fee, "ja")}
                onChange={(e) => {
                  const updated = [...rows];
                  updated[i] = {
                    ...updated[i],
                    fee: i18nSet(row.fee, "ja", e.currentTarget.value),
                  };
                  onUpdateField("rows", updated);
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
                説明（日/EN）
              </div>
              <TextInput
                fontSize={0}
                value={i18nGet(row.description, "ja")}
                onChange={(e) => {
                  const updated = [...rows];
                  updated[i] = {
                    ...updated[i],
                    description: i18nSet(row.description, "ja", e.currentTarget.value),
                  };
                  onUpdateField("rows", updated);
                }}
              />
              <TextInput
                fontSize={0}
                value={i18nGet(row.description, "en")}
                placeholder="EN"
                onChange={(e) => {
                  const updated = [...rows];
                  updated[i] = {
                    ...updated[i],
                    description: i18nSet(row.description, "en", e.currentTarget.value),
                  };
                  onUpdateField("rows", updated);
                }}
                style={{ marginTop: 2 }}
              />
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateField(
                  "rows",
                  rows.filter((_, idx) => idx !== i),
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
            onUpdateField("rows", [
              ...rows,
              {
                _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
                memberType: [
                  { _key: "ja", value: "" },
                  { _key: "en", value: "" },
                ],
                fee: [{ _key: "ja", value: "" }],
                description: [
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
          + 行を追加
        </button>
      </div>
    </>
  );
}
