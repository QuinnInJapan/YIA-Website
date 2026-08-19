"use client";

import { useMemo, useState } from "react";
import type { PortableTextBlock } from "@portabletext/editor";
import { TrashIcon } from "@sanity/icons";
import { useClient } from "sanity";
import createImageUrlBuilder from "@sanity/image-url";
import { fs } from "@/sanity/lib/studioTokens";
import { BilingualInput } from "../../shared/BilingualInput";
import { SimpleBodyEditor } from "../../shared/SimpleBodyEditor";
import { i18nGet, i18nGetBody, i18nSetBody } from "../../shared/i18n";
import type { SectionItem } from "../types";

interface ImageCardItem {
  _key: string;
  _type?: string;
  name?: { _key: string; value: string }[] | null;
  country?: { _key: string; value: string }[] | null;
  image?: { asset: { _ref: string } } | null;
  note?: { _key: string; value: string }[] | null;
}

type I18nBlocks = { _key: string; value: PortableTextBlock[] }[];

export function ImageCardsSectionEditor({
  section,
  onUpdateField,
  onOpenImagePicker,
}: {
  section: SectionItem;
  onUpdateField: (field: string, value: unknown) => void;
  onOpenImagePicker: (onSelect: (assetId: string) => void) => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(() => createImageUrlBuilder(client), [client]);
  const items = (section.items as ImageCardItem[]) ?? [];
  const body = (section.body ?? null) as I18nBlocks | null;
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

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const updated = [...items];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onUpdateField("items", updated);
    setExpandedIndex(target);
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
      updateItem(itemIndex, {
        image: { ...items[itemIndex]?.image, asset: { _ref: assetId } },
      });
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
        <div
          style={{
            fontSize: fs.label,
            fontWeight: 600,
            color: "var(--card-fg-color)",
            marginBottom: 6,
          }}
        >
          説明文（任意）
        </div>
        <div style={{ marginBottom: 8 }}>
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
          <SimpleBodyEditor
            initialValue={i18nGetBody(body, "ja")}
            onChange={(val) => onUpdateField("body", i18nSetBody(body, "ja", val))}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: fs.label,
              fontWeight: 600,
              color: "var(--card-fg-color)",
              marginBottom: 3,
            }}
          >
            英語（任意・運用検討中）
          </div>
          <SimpleBodyEditor
            initialValue={i18nGetBody(body, "en")}
            onChange={(val) => onUpdateField("body", i18nSetBody(body, "en", val))}
          />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: fs.label, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
          カード一覧
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
          {items.map((item, index) => {
            const isExpanded = expandedIndex === index;
            const nameJa = i18nGet(item.name, "ja") || "（名前なし）";
            const countryJa = i18nGet(item.country, "ja");
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
                  {/* Image thumbnail */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 3,
                      background: "var(--card-code-bg-color, rgba(0,0,0,0.05))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: fs.meta,
                      color: "var(--card-muted-fg-color)",
                      flexShrink: 0,
                    }}
                  >
                    {hasImage ? (
                      <img
                        src={builder
                          .image(item.image!)
                          .width(96)
                          .height(96)
                          .fit("crop")
                          .auto("format")
                          .url()}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      "画像なし"
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: fs.body,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {nameJa}
                    </div>
                    {countryJa ? (
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
                        {countryJa}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label={`${nameJa}を上へ移動`}
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveItem(index, -1);
                    }}
                    style={{
                      padding: 4,
                      border: "none",
                      background: "transparent",
                      color: "var(--card-muted-fg-color)",
                      cursor: index === 0 ? "default" : "pointer",
                      opacity: index === 0 ? 0.3 : 1,
                    }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label={`${nameJa}を下へ移動`}
                    disabled={index === items.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveItem(index, 1);
                    }}
                    style={{
                      padding: 4,
                      border: "none",
                      background: "transparent",
                      color: "var(--card-muted-fg-color)",
                      cursor: index === items.length - 1 ? "default" : "pointer",
                      opacity: index === items.length - 1 ? 0.3 : 1,
                    }}
                  >
                    ▼
                  </button>
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
                          fontSize: fs.meta,
                          color: "var(--card-muted-fg-color)",
                          marginBottom: 4,
                        }}
                      >
                        画像
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleImagePick(index)}
                          style={{
                            padding: "6px 12px",
                            border: "1px solid var(--card-border-color)",
                            borderRadius: 4,
                            background: "transparent",
                            color: "var(--card-fg-color)",
                            fontSize: fs.label,
                            cursor: "pointer",
                          }}
                        >
                          {hasImage ? "画像を変更" : "画像を選択"}
                        </button>
                        {hasImage ? (
                          <button
                            type="button"
                            onClick={() => updateItem(index, { image: null })}
                            style={{
                              padding: "6px 12px",
                              border: "1px solid var(--card-border-color)",
                              borderRadius: 4,
                              background: "transparent",
                              color: "var(--card-muted-fg-color)",
                              fontSize: fs.label,
                              cursor: "pointer",
                            }}
                          >
                            画像を外す
                          </button>
                        ) : null}
                      </div>
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
            fontSize: fs.label,
            cursor: "pointer",
          }}
        >
          ＋ カードを追加
        </button>
      </div>
    </>
  );
}
