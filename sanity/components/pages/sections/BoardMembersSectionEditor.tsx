"use client";

import { TextInput } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import { BilingualInput } from "../../shared/BilingualInput";
import { i18nGet, i18nSet } from "../../shared/i18n";
import type { SectionItem } from "../types";

interface BoardMemberItem {
  _key: string;
  _type?: string;
  name?: string;
  role?: { _key: string; value: string }[] | null;
}

export function BoardMembersSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  const members = (section.members as BoardMemberItem[]) ?? [];
  const asOf = (section.asOf as string) ?? "";

  return (
    <>
      <BilingualInput
        label="タイトル"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
          基準日
        </div>
        <TextInput
          fontSize={0}
          type="date"
          value={asOf}
          onChange={(e) => onUpdateField("asOf", e.currentTarget.value)}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
          役員一覧
        </div>
        {members.map((member, i) => (
          <div
            key={member._key}
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 6,
              alignItems: "start",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
                氏名
              </div>
              <TextInput
                fontSize={0}
                value={member.name ?? ""}
                onChange={(e) => {
                  const updated = [...members];
                  updated[i] = { ...updated[i], name: e.currentTarget.value };
                  onUpdateField("members", updated);
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
                役職（日/EN）
              </div>
              <TextInput
                fontSize={0}
                value={i18nGet(member.role, "ja")}
                onChange={(e) => {
                  const updated = [...members];
                  updated[i] = {
                    ...updated[i],
                    role: i18nSet(member.role, "ja", e.currentTarget.value),
                  };
                  onUpdateField("members", updated);
                }}
              />
              <TextInput
                fontSize={0}
                value={i18nGet(member.role, "en")}
                placeholder="EN"
                onChange={(e) => {
                  const updated = [...members];
                  updated[i] = {
                    ...updated[i],
                    role: i18nSet(member.role, "en", e.currentTarget.value),
                  };
                  onUpdateField("members", updated);
                }}
                style={{ marginTop: 4 }}
              />
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateField(
                  "members",
                  members.filter((_, idx) => idx !== i),
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
            onUpdateField("members", [
              ...members,
              {
                _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
                _type: "boardMember",
                name: "",
                role: [
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
          + 役員を追加
        </button>
      </div>
    </>
  );
}
