"use client";

import { useState } from "react";
import { TrashIcon } from "@sanity/icons";
import { BilingualInput } from "../../shared/BilingualInput";
import { i18nGet } from "../../shared/i18n";
import type { SectionItem } from "../types";

interface ImageCardItem {
  _key: string;
  _type?: string;
  name?: { _key: string; value: string }[] | null;
  country?: { _key: string; value: string }[] | null;
  image?: { asset: { _ref: string } } | null;
  note?: { _key: string; value: string }[] | null;
}

export function ImageCardsSectionEditor({
  section,
  onUpdateField,
  onOpenImagePicker,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
  onOpenImagePicker: (onSelect: (assetId: string) => void) => void;
}) {
  const items = (section.items as ImageCardItem[]) ?? [];
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  function updateItem(index: number, patch: Partial<ImageCardItem>) {
    const updated = [...items];
    updated[index] = { ...updated[index], ...patch };
    onUpdateField("items", updated);
  }

  function removeItem(index: number) {
    const updated = items.filter((_, i) => i !== index);
    onUpdateField("items", updated);
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index) setExpandedIndex(expandedIndex - 1);
  }

  function addItem() {
    const newItem: ImageCardItem = {
      _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
      _type: "sisterCity",
      name: [
        { _key: "ja", value: "" },
        { _key: "en", value: "" },
      ],
      country: [
        { _key: "ja", value: "" },
        { _key: "en", value: "" },
      ],
      note: [
        { _key: "ja", value: "" },
        { _key: "en", value: "" },
      ],
    };
    const newItems = [...items, newItem];
    onUpdateField("items", newItems);
    setExpandedIndex(newItems.length - 1);
  }

  function handleImagePick(itemIndex: number) {
    onOpenImagePicker((assetId: string) => {
      updateItem(itemIndex, { image: { asset: { _ref: assetId } } });
    });
  }

  return (
    <>
      <BilingualInput
        label="タイトル（任意）"
        value={section.title}
        onChange={(val) => onUpdateField("title", val)}
      />

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
          カード一覧
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
          {items.map((item, index) => {
            const isExpanded = expandedIndex === index;
            const nameJa = i18nGet(item.name, "ja") || "（名前なし）";
            const hasImage = !!item.image?.asset?._ref;

            return (
              <div
                key={item._key}
                style={{
                  border: "1px solid var(--card-border-color)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                {/* Card header row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    cursor: "pointer",
                    background: isExpanded ? "var(--card-bg-color)" : "transparent",
                  }}
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  {/* Image indicator */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 3,
                      background: hasImage
                        ? "var(--card-border-color)"
                        : "var(--card-code-bg-color, rgba(0,0,0,0.05))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      color: "var(--card-muted-fg-color)",
                      flexShrink: 0,
                    }}
                  >
                    {hasImage ? "🖼" : "画像なし"}
                  </div>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {nameJa}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(index);
                    }}
                    title="削除"
                    style={{
                      padding: 4,
                      border: "none",
                      background: "transparent",
                      color: "var(--card-muted-fg-color)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>

                {/* Expanded form */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderTop: "1px solid var(--card-border-color)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {/* Image */}
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--card-muted-fg-color)",
                          marginBottom: 4,
                        }}
                      >
                        画像
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImagePick(index)}
                        style={{
                          padding: "6px 12px",
                          border: "1px solid var(--card-border-color)",
                          borderRadius: 4,
                          background: "transparent",
                          color: "var(--card-fg-color)",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        {hasImage ? "画像を変更" : "画像を選択"}
                      </button>
                    </div>

                    {/* Name */}
                    <BilingualInput
                      label="名前"
                      value={item.name}
                      onChange={(val) => updateItem(index, { name: val })}
                    />

                    {/* Country */}
                    <BilingualInput
                      label="国"
                      value={item.country}
                      onChange={(val) => updateItem(index, { country: val })}
                    />

                    {/* Note */}
                    <BilingualInput
                      label="備考（任意）"
                      value={item.note}
                      onChange={(val) => updateItem(index, { note: val })}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
          ＋ カードを追加
        </button>
      </div>
    </>
  );
}
