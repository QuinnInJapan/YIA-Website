"use client";

import { useCallback, useEffect, useImperativeHandle, useState, forwardRef } from "react";
import { useClient } from "sanity";
import { Box, Flex, Stack, Text } from "@sanity/ui";
import { LoadingDots } from "../shared/ui";
import { type CategoryGroup, pageUrl } from "./types";

export interface PagesSidebarHandle {
  refresh: () => void;
}

// ── GROQ ─────────────────────────────────────────────────

const NAVIGATION_QUERY = `*[_type == "navigation"][0]{
  categories[]{
    _key,
    "categoryId": categoryRef._ref,
    "categoryLabel": categoryRef->label[_key == "ja"][0].value,
    "pages": items[]{
      _key,
      "pageId": pageRef._ref,
      "titleJa": pageRef->title[_key == "ja"][0].value,
      "slug": pageRef->slug,
      "hasDraft": defined(*[_id == "drafts." + ^.pageRef._ref][0])
    }
  }
}`;

// ── Component ────────────────────────────────────────────

export const PagesSidebar = forwardRef<
  PagesSidebarHandle,
  {
    selectedPageId: string | null;
    onSelectPage: (pageId: string, previewPath: string) => void;
  }
>(function PagesSidebar({ selectedPageId, onSelectPage }, ref) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNavigation = useCallback(() => {
    client
      .fetch<{ categories: CategoryGroup[] } | null>(NAVIGATION_QUERY)
      .then((result) => {
        setGroups(result?.categories ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [client]);

  useEffect(() => {
    fetchNavigation();
  }, [fetchNavigation]);

  useImperativeHandle(ref, () => ({ refresh: fetchNavigation }), [fetchNavigation]);

  // Listen for page draft changes to update draft indicators
  useEffect(() => {
    const subscription = client.listen('*[_type == "page"]').subscribe(() => fetchNavigation());
    return () => subscription.unsubscribe();
  }, [client, fetchNavigation]);

  if (loading) {
    return (
      <Flex align="center" justify="center" padding={4} style={{ height: "100%" }}>
        <LoadingDots />
      </Flex>
    );
  }

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
      <Stack space={4}>
        {groups.map((group) => (
          <div key={group._key}>
            <Box paddingX={2} paddingY={1}>
              <Text size={0} weight="semibold" muted>
                {group.categoryLabel ?? "未分類"}
              </Text>
            </Box>
            <Stack space={1} marginTop={1}>
              {group.pages.map((page) => (
                <button
                  key={page._key}
                  type="button"
                  onClick={() => onSelectPage(page.pageId, pageUrl(group.categoryId, page.slug))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    border: "none",
                    borderRadius: 4,
                    background:
                      page.pageId === selectedPageId ? "var(--card-border-color)" : "transparent",
                    cursor: "pointer",
                    color: "var(--card-fg-color)",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: page.pageId === selectedPageId ? 600 : 400,
                        lineHeight: 1.3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {page.titleJa ?? "（タイトルなし）"}
                    </div>
                  </div>
                  {page.hasDraft && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#e6a317",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              ))}
            </Stack>
          </div>
        ))}
      </Stack>
    </div>
  );
});
