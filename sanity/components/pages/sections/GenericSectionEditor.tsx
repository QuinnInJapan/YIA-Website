"use client";

import { TextInput } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import { BilingualInput } from "../../shared/BilingualInput";
import { BilingualTextarea } from "../../shared/BilingualTextarea";
import { i18nGet, i18nSet } from "../../shared/i18n";
import type { SectionItem, SectionTypeName } from "../types";
import { SECTION_TYPE_LABELS } from "../types";

// ── Static field configs per section type ────────────────

interface FieldConfig {
  key: string;
  label: string;
  type:
    | "bilingualInput"
    | "bilingualTextarea"
    | "string"
    | "date"
    | "stringArray"
    | "bilingualTextList";
}

interface ListFieldConfig {
  key: string;
  label: string;
  addLabel: string;
  subType?: string;
  fields: { key: string; label: string; type: "string" | "bilingualInput" | "url" | "date" }[];
}

interface SectionConfig {
  showTitle: boolean;
  fields: FieldConfig[];
  lists: ListFieldConfig[];
}

const SECTION_CONFIGS: Partial<Record<SectionTypeName, SectionConfig>> = {
  warnings: {
    showTitle: false,
    fields: [],
    lists: [
      {
        key: "items",
        label: "注意事項",
        addLabel: "+ 注意事項を追加",
        fields: [],
      },
    ],
  },
};

// ── Component ────────────────────────────────────────────

export function GenericSectionEditor({
  section,
  onUpdateField,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
}) {
  const config = SECTION_CONFIGS[section._type as SectionTypeName];
  const typeLabel = SECTION_TYPE_LABELS[section._type as SectionTypeName] ?? section._type;

  if (!config) {
    return (
      <>
        <BilingualInput
          label="タイトル"
          value={section.title}
          onChange={(val) => onUpdateField("title", val)}
        />
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)" }}>
          「{typeLabel}」セクションの編集は未対応です。
        </div>
      </>
    );
  }

  return (
    <>
      {config.showTitle && (
        <BilingualInput
          label="タイトル"
          value={section.title}
          onChange={(val) => onUpdateField("title", val)}
        />
      )}

      {/* Simple fields */}
      {config.fields.map((field) => {
        const val = section[field.key] as { _key: string; value: string }[] | null;
        switch (field.type) {
          case "bilingualInput":
            return (
              <BilingualInput
                key={field.key}
                label={field.label}
                value={val}
                onChange={(v) => onUpdateField(field.key, v)}
              />
            );
          case "bilingualTextarea":
            return (
              <BilingualTextarea
                key={field.key}
                label={field.label}
                value={val}
                onChange={(v) => onUpdateField(field.key, v)}
              />
            );
          case "string":
            return (
              <div key={field.key} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
                  {field.label}
                </div>
                <TextInput
                  fontSize={0}
                  value={(section[field.key] as string) ?? ""}
                  onChange={(e) => onUpdateField(field.key, e.currentTarget.value)}
                />
              </div>
            );
          case "date":
            return (
              <div key={field.key} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
                  {field.label}
                </div>
                <TextInput
                  fontSize={0}
                  type="date"
                  value={(section[field.key] as string) ?? ""}
                  onChange={(e) => onUpdateField(field.key, e.currentTarget.value)}
                />
              </div>
            );
          default:
            return null;
        }
      })}

      {/* warnings special case: items are internationalizedArrayText */}
      {section._type === "warnings" && (
        <WarningsEditor
          items={
            (section.items as { _key: string; value: { _key: string; value: string }[] }[]) ?? []
          }
          onChange={(items) => onUpdateField("items", items)}
        />
      )}

      {/* List fields */}
      {config.lists.map((listConfig) => {
        if (section._type === "warnings") return null;
        const items = (section[listConfig.key] as Record<string, unknown>[]) ?? [];
        return (
          <GenericListEditor
            key={listConfig.key}
            label={listConfig.label}
            addLabel={listConfig.addLabel}
            subType={listConfig.subType}
            fields={listConfig.fields}
            items={items}
            onChange={(updated) => onUpdateField(listConfig.key, updated)}
          />
        );
      })}
    </>
  );
}

// ── Warnings special editor ──────────────────────────────

function WarningsEditor({
  items,
  onChange,
}: {
  items: { _key: string; value: { _key: string; value: string }[] }[];
  onChange: (items: { _key: string; value: { _key: string; value: string }[] }[]) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
        注意事項
      </div>
      {items.map((item, i) => (
        <div
          key={item._key}
          style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "start" }}
        >
          <div style={{ flex: 1 }}>
            <textarea
              rows={2}
              value={item.value?.find((v) => v._key === "ja")?.value ?? ""}
              onChange={(e) => {
                const updated = [...items];
                const val = i18nSet(item.value, "ja", e.target.value);
                updated[i] = { ...updated[i], value: val };
                onChange(updated);
              }}
              placeholder="日本語"
              style={{
                width: "100%",
                padding: "6px 10px",
                border: "1px solid var(--card-border-color)",
                borderRadius: 4,
                fontSize: 13,
                fontFamily: "inherit",
                resize: "vertical",
                background: "transparent",
                color: "inherit",
              }}
            />
            <textarea
              rows={2}
              value={item.value?.find((v) => v._key === "en")?.value ?? ""}
              onChange={(e) => {
                const updated = [...items];
                const val = i18nSet(item.value, "en", e.target.value);
                updated[i] = { ...updated[i], value: val };
                onChange(updated);
              }}
              placeholder="English"
              style={{
                width: "100%",
                padding: "6px 10px",
                border: "1px solid var(--card-border-color)",
                borderRadius: 4,
                fontSize: 13,
                fontFamily: "inherit",
                resize: "vertical",
                background: "transparent",
                color: "inherit",
                marginTop: 4,
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
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
          onChange([
            ...items,
            {
              _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
              value: [
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
        + 注意事項を追加
      </button>
    </div>
  );
}

// ── Generic list editor ──────────────────────────────────

function GenericListEditor({
  label,
  addLabel,
  subType,
  fields,
  items,
  onChange,
}: {
  label: string;
  addLabel: string;
  subType?: string;
  fields: { key: string; label: string; type: "string" | "bilingualInput" | "url" | "date" }[];
  items: Record<string, unknown>[];
  onChange: (items: Record<string, unknown>[]) => void;
}) {
  function addItem() {
    const newItem: Record<string, unknown> = {
      _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
    };
    if (subType) newItem._type = subType;
    for (const field of fields) {
      if (field.type === "bilingualInput") {
        newItem[field.key] = [
          { _key: "ja", value: "" },
          { _key: "en", value: "" },
        ];
      } else {
        newItem[field.key] = "";
      }
    }
    onChange([...items, newItem]);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
        {label}
      </div>
      {items.map((item, i) => (
        <div
          key={item._key as string}
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 6,
            padding: "8px 10px",
            border: "1px solid var(--card-border-color)",
            borderRadius: 4,
            alignItems: "start",
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            {fields.map((field) => {
              const val = item[field.key];
              if (field.type === "bilingualInput") {
                const i18nVal = val as { _key: string; value: string }[] | null;
                return (
                  <div key={field.key} style={{ display: "flex", gap: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--card-muted-fg-color)",
                          marginBottom: 2,
                        }}
                      >
                        {field.label}（日）
                      </div>
                      <TextInput
                        fontSize={0}
                        value={i18nGet(i18nVal, "ja")}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[i] = {
                            ...updated[i],
                            [field.key]: i18nSet(i18nVal, "ja", e.currentTarget.value),
                          };
                          onChange(updated);
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--card-muted-fg-color)",
                          marginBottom: 2,
                        }}
                      >
                        {field.label}（EN）
                      </div>
                      <TextInput
                        fontSize={0}
                        value={i18nGet(i18nVal, "en")}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[i] = {
                            ...updated[i],
                            [field.key]: i18nSet(i18nVal, "en", e.currentTarget.value),
                          };
                          onChange(updated);
                        }}
                      />
                    </div>
                  </div>
                );
              }
              return (
                <div key={field.key}>
                  <div
                    style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}
                  >
                    {field.label}
                  </div>
                  <TextInput
                    fontSize={0}
                    type={field.type === "date" ? "date" : "text"}
                    value={(val as string) ?? ""}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[i] = { ...updated[i], [field.key]: e.currentTarget.value };
                      onChange(updated);
                    }}
                  />
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
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
        onClick={addItem}
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
        {addLabel}
      </button>
    </div>
  );
}
