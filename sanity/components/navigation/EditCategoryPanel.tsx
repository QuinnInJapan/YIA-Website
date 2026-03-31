// sanity/components/navigation/EditCategoryPanel.tsx
"use client";

import { useMemo, useState } from "react";
import { Box, Flex, Text } from "@sanity/ui";
import { useClient } from "sanity";
import createImageUrlBuilder from "@sanity/image-url";
import { i18nGet } from "../shared/i18n";
import type { NavCategoryRaw, NavItemRaw, CategoryDoc, PageDoc, RightPanelState } from "./types";

export function EditCategoryPanel({
  navCategory,
  categoryDoc,
  pagesMap,
  onTogglePageHidden,
  onRemovePage,
  onReorder,
  onAddPage,
  onOpenPanel,
  onClose,
}: {
  navCategory: NavCategoryRaw;
  categoryDoc: CategoryDoc | undefined;
  pagesMap: Map<string, PageDoc>;
  onTogglePageHidden: (itemKey: string) => void;
  onRemovePage: (itemKey: string) => void;
  onReorder: (reordered: NavItemRaw[]) => void;
  onAddPage: () => void;
  onOpenPanel: (panel: RightPanelState) => void;
  onClose: () => void;
}) {
  const [localItems, setLocalItems] = useState<NavItemRaw[]>(navCategory.items ?? []);

  const labelJa = i18nGet(categoryDoc?.label, "ja") || "Untitled";

  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(() => createImageUrlBuilder(client), [client]);

  const heroUrl = useMemo(() => {
    if (!categoryDoc?.heroImage?.asset?._ref) return null;
    return builder
      .image(categoryDoc.heroImage)
      .width(600)
      .height(338)
      .fit("crop")
      .auto("format")
      .url();
  }, [categoryDoc, builder]);

  function move(idx: number, direction: -1 | 1) {
    const target = idx + direction;
    if (target < 0 || target >= localItems.length) return;
    const next = [...localItems];
    [next[idx], next[target]] = [next[target], next[idx]];
    setLocalItems(next);
    onReorder(next);
  }

  function handleToggleHidden(itemKey: string) {
    setLocalItems((prev) =>
      prev.map((item) => (item._key === itemKey ? { ...item, hidden: !item.hidden } : item)),
    );
    onTogglePageHidden(itemKey);
  }

  function handleRemove(itemKey: string) {
    setLocalItems((prev) => prev.filter((item) => item._key !== itemKey));
    onRemovePage(itemKey);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box
        padding={3}
        style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}
      >
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            {labelJa}
          </Text>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
              color: "var(--card-muted-fg-color)",
            }}
          >
            ✕
          </button>
        </Flex>
      </Box>

      {/* Hero image section */}
      <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
        <div
          style={{
            width: "100%",
            aspectRatio: "16/9",
            borderRadius: 4,
            overflow: "hidden",
            background: "var(--card-muted-bg-color, #eee)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {heroUrl ? (
            <img
              src={heroUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <span style={{ fontSize: 12, color: "var(--card-muted-fg-color)" }}>画像なし</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onOpenPanel({ type: "changeHeroImage", categoryKey: navCategory._key })}
          style={{
            marginTop: 6,
            fontSize: 12,
            padding: "4px 10px",
            border: "1px solid var(--card-border-color)",
            borderRadius: 4,
            background: "transparent",
            cursor: "pointer",
            color: "var(--card-muted-fg-color)",
          }}
        >
          画像を変更
        </button>
      </div>

      {/* Page list */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
        {localItems.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center" }}>
            <Text size={1} muted>
              ページがありません
            </Text>
          </div>
        ) : (
          localItems.map((item, idx) => {
            const pageDoc = pagesMap.get(item.pageRef?._ref);
            const title = i18nGet(pageDoc?.title, "ja") || "Untitled";
            return (
              <div
                key={item._key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 16px",
                  gap: 6,
                  borderBottom: "1px solid var(--card-border-color)",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: item.hidden ? "var(--card-muted-fg-color)" : "var(--card-fg-color)",
                  }}
                >
                  {title}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleHidden(item._key)}
                  style={{
                    border: "1px solid var(--card-border-color)",
                    borderRadius: 4,
                    background: item.hidden
                      ? "var(--card-bg-color)"
                      : "var(--card-badge-default-bg-color, #e6f0e6)",
                    color: item.hidden
                      ? "var(--card-muted-fg-color)"
                      : "var(--card-badge-default-fg-color, #2d6a2d)",
                    cursor: "pointer",
                    padding: "2px 8px",
                    fontSize: 11,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {item.hidden ? "非表示" : "表示中"}
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  style={{
                    border: "1px solid var(--card-border-color)",
                    borderRadius: 4,
                    background: "var(--card-bg-color)",
                    cursor: idx === 0 ? "default" : "pointer",
                    opacity: idx === 0 ? 0.3 : 1,
                    padding: "2px 8px",
                    fontSize: 12,
                    color: "var(--card-fg-color)",
                    flexShrink: 0,
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === localItems.length - 1}
                  style={{
                    border: "1px solid var(--card-border-color)",
                    borderRadius: 4,
                    background: "var(--card-bg-color)",
                    cursor: idx === localItems.length - 1 ? "default" : "pointer",
                    opacity: idx === localItems.length - 1 ? 0.3 : 1,
                    padding: "2px 8px",
                    fontSize: 12,
                    color: "var(--card-fg-color)",
                    flexShrink: 0,
                  }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(item._key)}
                  title="このページを削除"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 14,
                    color: "var(--card-muted-fg-color)",
                    padding: "2px 4px",
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <Box padding={3} style={{ borderTop: "1px solid var(--card-border-color)", flexShrink: 0 }}>
        <button
          type="button"
          onClick={onAddPage}
          style={{
            fontSize: 13,
            padding: "8px 16px",
            border: "1px dashed var(--card-border-color)",
            borderRadius: 6,
            background: "transparent",
            cursor: "pointer",
            color: "var(--card-muted-fg-color)",
            width: "100%",
          }}
        >
          + ページを追加
        </button>
      </Box>
    </div>
  );
}
