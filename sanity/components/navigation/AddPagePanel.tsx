// sanity/components/navigation/AddPagePanel.tsx
"use client";

import { useMemo } from "react";
import { Box, Flex, Text } from "@sanity/ui";
import { i18nGet } from "../shared/i18n";
import type { NavCategoryRaw, PageDoc } from "./types";

export function AddPagePanel({
  categoryKey,
  categories,
  allPages,
  onAddPage,
  onClose,
}: {
  categoryKey: string;
  categories: NavCategoryRaw[];
  allPages: PageDoc[];
  onAddPage: (categoryKey: string, pageId: string) => void;
  onClose: () => void;
}) {
  // Find all page IDs currently assigned to any category
  const assignedPageIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cat of categories) {
      for (const item of cat.items ?? []) {
        if (item.pageRef?._ref) ids.add(item.pageRef._ref);
      }
    }
    return ids;
  }, [categories]);

  // Unassigned pages
  const unassigned = useMemo(
    () => allPages.filter((p) => !assignedPageIds.has(p._id)),
    [allPages, assignedPageIds],
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box
        padding={3}
        style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}
      >
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            ページを追加
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

      {/* Page list */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
        {unassigned.length === 0 ? (
          <Text size={1} muted style={{ padding: "24px 16px", textAlign: "center" }}>
            未割り当てのページがありません
          </Text>
        ) : (
          unassigned.map((page) => {
            const title = i18nGet(page.title, "ja") || page.slug || "Untitled";
            return (
              <button
                key={page._id}
                type="button"
                onClick={() => onAddPage(categoryKey, page._id)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 16px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 13,
                  color: "var(--card-fg-color)",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = "var(--card-bg2-color, #f5f5f5)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = "transparent";
                }}
              >
                {title}
                {page.slug && (
                  <span
                    style={{ marginLeft: 8, fontSize: 11, color: "var(--card-muted-fg-color)" }}
                  >
                    /{page.slug}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
