"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

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
    if (expandedKey === items[index]?._key) setExpandedKey(null);
    onChange(items.filter((_, i) => i !== index));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const updated = [...items];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(updated);
  }

  function addItem() {
    const key = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    onChange([
      ...items,
      {
        _key: key,
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
    setExpandedKey(key);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      {label ? (
        <div style={{ fontSize: fs.label, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
          {label}
        </div>
      ) : null}
      {items.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 8,
          }}
        >
          {items.map((item, index) => {
            const itemKey = item._key as string;
            const isExpanded = expandedKey === itemKey;
            const labelJa = i18nGet(getI18n(item, labelField), "ja") || `（${labelHeader}未入力）`;
            const valueJa = i18nGet(getI18n(item, valueField), "ja");
            return (
              <div
                key={itemKey}
                style={{
                  border: "1px solid var(--card-border-color)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 10px",
                    background: isExpanded ? "var(--card-bg-color)" : "transparent",
                  }}
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedKey(isExpanded ? null : itemKey)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: 0,
                      border: "none",
                      background: "transparent",
                      color: "inherit",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: fs.body, fontWeight: 600 }}>{labelJa}</div>
                    {valueJa ? (
                      <div
                        style={{
                          marginTop: 2,
                          fontSize: fs.meta,
                          color: "var(--card-muted-fg-color)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {valueJa}
                      </div>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    aria-label={`${labelJa}を上へ移動`}
                    disabled={index === 0}
                    onClick={() => moveItem(index, -1)}
                    style={{ border: "none", background: "transparent", opacity: index === 0 ? 0.3 : 1 }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label={`${labelJa}を下へ移動`}
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, 1)}
                    style={{
                      border: "none",
                      background: "transparent",
                      opacity: index === items.length - 1 ? 0.3 : 1,
                    }}
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    aria-label={`${labelJa}を削除`}
                    style={{
                      display: "flex",
                      border: "none",
                      background: "transparent",
                      color: "var(--card-muted-fg-color)",
                      cursor: "pointer",
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>

                {isExpanded ? (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderTop: "1px solid var(--card-border-color)",
                    }}
                  >
                    {(["ja", "en"] as const).map((lang) => (
                      <div key={lang} style={{ marginBottom: lang === "ja" ? 12 : 0 }}>
                        <div
                          style={{
                            marginBottom: 5,
                            fontSize: fs.label,
                            fontWeight: 600,
                            color: "var(--card-muted-fg-color)",
                          }}
                        >
                          {lang === "ja" ? "日本語" : "英語"}
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(120px, 1fr) minmax(180px, 1.6fr)",
                            gap: 8,
                          }}
                        >
                          <TextInput
                            fontSize={0}
                            value={i18nGet(getI18n(item, labelField), lang)}
                            placeholder={
                              lang === "ja" ? placeholders?.labelJa : placeholders?.labelEn
                            }
                            onChange={(e) =>
                              updateItem(index, labelField, lang, e.currentTarget.value)
                            }
                          />
                          <AutoTextarea
                            value={i18nGet(getI18n(item, valueField), lang)}
                            placeholder={
                              lang === "ja" ? placeholders?.valueJa : placeholders?.valueEn
                            }
                            onChange={(text) => updateItem(index, valueField, lang, text)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
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
