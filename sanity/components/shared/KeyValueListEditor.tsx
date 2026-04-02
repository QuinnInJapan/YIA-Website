"use client";

import { useCallback, useEffect, useRef } from "react";
import { TextInput } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
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
        fontSize: 12,
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
  label: string;
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
      <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
        {label}
      </div>

      {items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
          {items.map((item, index) => (
            <div
              key={item._key as string}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto",
                gap: 6,
                padding: "8px 10px",
                border: "1px solid var(--card-border-color)",
                borderRadius: 4,
                alignItems: "start",
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
                  {labelHeader}（日/EN）
                </div>
                <TextInput
                  fontSize={0}
                  value={i18nGet(getI18n(item, labelField), "ja")}
                  placeholder={placeholders?.labelJa}
                  onChange={(e) => updateItem(index, labelField, "ja", e.currentTarget.value)}
                  style={{ marginBottom: 4 }}
                />
                <TextInput
                  fontSize={0}
                  value={i18nGet(getI18n(item, labelField), "en")}
                  placeholder={placeholders?.labelEn}
                  onChange={(e) => updateItem(index, labelField, "en", e.currentTarget.value)}
                />
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
                  {valueHeader}（日/EN）
                </div>
                <AutoTextarea
                  value={i18nGet(getI18n(item, valueField), "ja")}
                  placeholder={placeholders?.valueJa}
                  onChange={(text) => updateItem(index, valueField, "ja", text)}
                  style={{ marginBottom: 4 }}
                />
                <AutoTextarea
                  value={i18nGet(getI18n(item, valueField), "en")}
                  placeholder={placeholders?.valueEn}
                  onChange={(text) => updateItem(index, valueField, "en", text)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                title="削除"
                style={{
                  padding: "4px",
                  border: "none",
                  borderRadius: 3,
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
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        {addLabel}
      </button>
    </div>
  );
}
