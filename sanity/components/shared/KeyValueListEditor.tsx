"use client";

import { useCallback, useEffect, useRef } from "react";
import { TextInput } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import { fs } from "@/sanity/lib/studioTokens";
import { i18nGet, i18nSet } from "./i18n";

function AutoTextarea({
  value,
  onChange,
  placeholder,
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(resize, [value, resize]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
      style={{
        width: "100%",
        padding: "6px 8px",
        border: "1px solid var(--card-border-color)",
        borderRadius: 4,
        fontSize: fs.label,
        fontFamily: "inherit",
        resize: "none",
        overflow: "hidden",
        background: "transparent",
        color: "inherit",
        lineHeight: 1.4,
        ...style,
      }}
    />
  );
}

interface KeyValueItem {
  _key: string;
  [key: string]: unknown;
}

export function KeyValueListEditor({
  label,
  labelHeader = "ラベル",
  valueHeader = "値",
  fieldNames = { label: "label", value: "value" },
  placeholders,
  addLabel = "+ 行を追加",
  items,
  onChange,
}: {
  label?: string;
  labelHeader?: string;
  valueHeader?: string;
  fieldNames?: { label: string; value: string };
  placeholders?: {
    labelJa?: string;
    labelEn?: string;
    valueJa?: string;
    valueEn?: string;
  };
  addLabel?: string;
  items: KeyValueItem[];
  onChange: (items: KeyValueItem[]) => void;
}) {
  const labelField = fieldNames.label;
  const valueField = fieldNames.value;

  function getI18n(item: KeyValueItem, field: string) {
    return item[field] as { _key: string; value: string }[] | null | undefined;
  }

  function updateItem(index: number, field: string, lang: string, text: string) {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: i18nSet(getI18n(updated[index], field) ?? null, lang, text),
    };
    onChange(updated);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([
      ...items,
      {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        [labelField]: [
          { _key: "ja", value: "" },
          { _key: "en", value: "" },
        ],
        [valueField]: [
          { _key: "ja", value: "" },
          { _key: "en", value: "" },
        ],
      },
    ]);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      {items.length > 0 && (
        <div
          style={{
            border: "1px solid var(--card-border-color)",
            borderRadius: 4,
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.6fr 24px",
              gridTemplateRows: "auto auto",
              background: "var(--card-bg2-color, var(--card-border-color))",
              borderBottom: "1px solid var(--card-border-color)",
            }}
          >
            <div
              style={{
                gridColumn: 1,
                gridRow: 1,
                padding: "5px 8px",
                fontSize: fs.meta,
                fontWeight: 600,
                color: "var(--card-fg-color)",
                borderRight: "1px solid var(--card-border-color)",
                borderBottom: "1px solid var(--card-border-color)",
              }}
            >
              {labelHeader}
            </div>
            <div
              style={{
                gridColumn: 2,
                gridRow: 1,
                padding: "5px 8px",
                fontSize: fs.meta,
                fontWeight: 600,
                color: "var(--card-fg-color)",
                borderBottom: "1px solid var(--card-border-color)",
              }}
            >
              {valueHeader}
            </div>
            <div style={{ gridColumn: 3, gridRow: "1 / span 2" }} />
            <div
              style={{
                gridColumn: 1,
                gridRow: 2,
                padding: "5px 8px",
                fontSize: fs.meta,
                fontWeight: 600,
                color: "var(--card-muted-fg-color)",
                borderRight: "1px solid var(--card-border-color)",
              }}
            >
              {labelHeader === "ラベル" ? "Label" : labelHeader}
            </div>
            <div
              style={{
                gridColumn: 2,
                gridRow: 2,
                padding: "5px 8px",
                fontSize: fs.meta,
                fontWeight: 600,
                color: "var(--card-muted-fg-color)",
              }}
            >
              {valueHeader === "値" ? "Value" : valueHeader}
            </div>
          </div>

          {/* Data rows */}
          {items.map((item, index) => (
            <div
              key={item._key as string}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.6fr 24px",
                gridTemplateRows: "auto auto",
                borderBottom:
                  index < items.length - 1 ? "1px solid var(--card-border-color)" : undefined,
              }}
            >
              {/* Japanese label input */}
              <div
                style={{
                  gridColumn: 1,
                  gridRow: 1,
                  padding: "6px 8px 3px",
                  borderRight: "1px solid var(--card-border-color)",
                }}
              >
                <div
                  style={{
                    fontSize: fs.label,
                    fontWeight: 600,
                    color: "var(--card-fg-color)",
                    marginBottom: 3,
                  }}
                >
                  日本語
                </div>
                <TextInput
                  fontSize={0}
                  value={i18nGet(getI18n(item, labelField), "ja")}
                  placeholder={placeholders?.labelJa}
                  onChange={(e) => updateItem(index, labelField, "ja", e.currentTarget.value)}
                />
              </div>

              {/* Japanese value textarea */}
              <div style={{ gridColumn: 2, gridRow: 1, padding: "6px 8px 3px" }}>
                <div
                  style={{
                    fontSize: fs.label,
                    fontWeight: 600,
                    color: "var(--card-fg-color)",
                    marginBottom: 3,
                  }}
                >
                  日本語
                </div>
                <AutoTextarea
                  value={i18nGet(getI18n(item, valueField), "ja")}
                  placeholder={placeholders?.valueJa}
                  onChange={(text) => updateItem(index, valueField, "ja", text)}
                />
              </div>

              {/* Delete button — spans both rows */}
              <button
                type="button"
                onClick={() => removeItem(index)}
                title="削除"
                style={{
                  gridColumn: 3,
                  gridRow: "1 / span 2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  background: "transparent",
                  color: "var(--card-muted-fg-color)",
                  cursor: "pointer",
                }}
              >
                <TrashIcon />
              </button>

              {/* English label input */}
              <div
                style={{
                  gridColumn: 1,
                  gridRow: 2,
                  padding: "3px 8px 6px",
                  borderRight: "1px solid var(--card-border-color)",
                }}
              >
                <div
                  style={{
                    fontSize: fs.label,
                    fontWeight: 600,
                    color: "var(--card-fg-color)",
                    marginBottom: 3,
                  }}
                >
                  English
                </div>
                <TextInput
                  fontSize={0}
                  value={i18nGet(getI18n(item, labelField), "en")}
                  placeholder={placeholders?.labelEn}
                  onChange={(e) => updateItem(index, labelField, "en", e.currentTarget.value)}
                />
              </div>

              {/* English value textarea */}
              <div style={{ gridColumn: 2, gridRow: 2, padding: "3px 8px 6px" }}>
                <div
                  style={{
                    fontSize: fs.label,
                    fontWeight: 600,
                    color: "var(--card-fg-color)",
                    marginBottom: 3,
                  }}
                >
                  English
                </div>
                <AutoTextarea
                  value={i18nGet(getI18n(item, valueField), "en")}
                  placeholder={placeholders?.valueEn}
                  onChange={(text) => updateItem(index, valueField, "en", text)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addItem}
        style={{
          padding: "6px 12px",
          border: "1px dashed var(--card-border-color)",
          borderRadius: 4,
          background: "transparent",
          color: "var(--card-muted-fg-color)",
          fontSize: fs.label,
          cursor: "pointer",
        }}
      >
        {addLabel}
      </button>
    </div>
  );
}
