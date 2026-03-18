"use client";

import { useCallback, useEffect, useRef } from "react";
import { TextInput } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import { i18nGet, i18nSet } from "./i18n";

function AutoTextarea({
  value,
  onChange,
  style,
}: {
  value: string;
  onChange: (value: string) => void;
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
  label?: { _key: string; value: string }[] | null;
  value?: { _key: string; value: string }[] | null;
  [key: string]: unknown;
}

export function KeyValueListEditor({
  label,
  labelHeader = "ラベル",
  valueHeader = "値",
  items,
  onChange,
}: {
  label: string;
  labelHeader?: string;
  valueHeader?: string;
  items: KeyValueItem[];
  onChange: (items: KeyValueItem[]) => void;
}) {
  function updateItem(index: number, field: "label" | "value", lang: string, text: string) {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: i18nSet(
        updated[index][field] as { _key: string; value: string }[] | null,
        lang,
        text,
      ),
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
        label: [
          { _key: "ja", value: "" },
          { _key: "en", value: "" },
        ],
        value: [
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
              key={item._key}
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
                  value={i18nGet(item.label, "ja")}
                  onChange={(e) => updateItem(index, "label", "ja", e.currentTarget.value)}
                  style={{ marginBottom: 4 }}
                />
                <TextInput
                  fontSize={0}
                  value={i18nGet(item.label, "en")}
                  onChange={(e) => updateItem(index, "label", "en", e.currentTarget.value)}
                />
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)", marginBottom: 2 }}>
                  {valueHeader}（日/EN）
                </div>
                <AutoTextarea
                  value={i18nGet(item.value, "ja")}
                  onChange={(text) => updateItem(index, "value", "ja", text)}
                  style={{ marginBottom: 4 }}
                />
                <AutoTextarea
                  value={i18nGet(item.value, "en")}
                  onChange={(text) => updateItem(index, "value", "en", text)}
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
        + 行を追加
      </button>
    </div>
  );
}
