// sanity/components/unified-pages/CategoryPreview.tsx
"use client";

import { Text } from "@sanity/ui";
import type { NavCategoryRaw, NavPageDoc } from "./types";

export function CategoryPreview({
  navCat,
  pagesMap,
}: {
  navCat: NavCategoryRaw;
  pagesMap: Map<string, NavPageDoc>;
}) {
  const items = navCat.items ?? [];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--card-border-color)",
          flexShrink: 0,
        }}
      >
        <Text size={0} muted>
          ページ一覧（プレビュー）
        </Text>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {items.length === 0 ? (
          <Text size={0} muted>
            ページがありません
          </Text>
        ) : (
          items.map((item) => {
            const page = pagesMap.get(item.pageRef._ref);
            if (!page) return null;
            const titleJa = page.title?.find((t) => t._key === "ja")?.value ?? "（タイトルなし）";
            return (
              <div
                key={item._key}
                style={{
                  padding: "6px 8px",
                  borderRadius: 4,
                  marginBottom: 2,
                  opacity: item.hidden ? 0.45 : 1,
                }}
              >
                <Text
                  size={1}
                  style={{
                    color: item.hidden ? "var(--card-muted-fg-color)" : "var(--card-fg-color)",
                  }}
                >
                  {titleJa}
                </Text>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
