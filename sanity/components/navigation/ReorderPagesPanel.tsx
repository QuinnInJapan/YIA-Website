// sanity/components/navigation/ReorderPagesPanel.tsx
"use client";

import { useState } from "react";
import { Box, Flex, Text } from "@sanity/ui";
import { i18nGet } from "../shared/i18n";
import type { NavItemRaw, PageDoc } from "./types";

export function ReorderPagesPanel({
  items,
  pagesMap,
  onReorder,
  onClose,
}: {
  items: NavItemRaw[];
  pagesMap: Map<string, PageDoc>;
  onReorder: (reordered: NavItemRaw[]) => void;
  onClose: () => void;
}) {
  const [localItems, setLocalItems] = useState<NavItemRaw[]>(items);

  function move(idx: number, direction: -1 | 1) {
    const target = idx + direction;
    if (target < 0 || target >= localItems.length) return;
    const next = [...localItems];
    [next[idx], next[target]] = [next[target], next[idx]];
    setLocalItems(next);
    onReorder(next);
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
            並び替え
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

      {/* Reorder list */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
        {localItems.map((item, idx) => {
          const pageDoc = pagesMap.get(item.pageRef?._ref);
          const title = i18nGet(pageDoc?.title, "ja") || "Untitled";
          return (
            <div
              key={item._key}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 16px",
                gap: 8,
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
                }}
              >
                {title}
              </span>
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
                }}
              >
                ↓
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
