"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import { LaunchIcon, RefreshIcon } from "@sanity/icons";
import { useClient } from "sanity";
import { LoadingDots } from "./shared/ui";
import { formatStudioRelativeTime } from "./shared/date-format";
import { fs } from "@/sanity/lib/studioTokens";

interface DraftItem {
  _id: string;
  _type: string;
  _updatedAt?: string;
  title?: { _key: string; value: string }[];
  label?: { _key: string; value: string }[];
}

const DRAFTS_QUERY = `*[_id in path("drafts.**")] | order(_updatedAt desc) {
  _id, _type, _updatedAt, title, label
}`;

const TYPE_CONFIG: Record<string, { label: string; tool?: string }> = {
  page: { label: "ページ", tool: "pages" },
  announcement: { label: "お知らせ", tool: "announcements" },
  blogPost: { label: "ブログ", tool: "blog" },
  homepage: { label: "ホームページ", tool: "homepage" },
  homepageAbout: { label: "YIAについて", tool: "homepage" },
  homepageFeatured: { label: "注目カテゴリ", tool: "homepage" },
  siteSettings: { label: "サイト設定", tool: "homepage" },
  sidebar: { label: "サイドバー・フッター", tool: "homepage" },
  category: { label: "カテゴリ" },
  navigation: { label: "ナビゲーション" },
};

function japaneseValue(value?: { _key: string; value: string }[]) {
  return value?.find((item) => item._key === "ja")?.value?.trim() ?? "";
}

function draftTitle(item: DraftItem) {
  return (
    japaneseValue(item.title) ||
    japaneseValue(item.label) ||
    TYPE_CONFIG[item._type]?.label ||
    "タイトル未入力"
  );
}

export function DraftsTool() {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [items, setItems] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const drafts = await client.fetch<DraftItem[]>(DRAFTS_QUERY);
      setItems(drafts);
      setError(null);
    } catch (err) {
      console.error("Failed to load drafts:", err);
      setError("未公開の変更を読み込めませんでした。通信状況を確認して、再読み込みしてください。");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchDrafts();
    const subscription = client.listen('*[_id in path("drafts.**")]').subscribe(fetchDrafts);
    return () => subscription.unsubscribe();
  }, [client, fetchDrafts]);

  const groups = useMemo(() => {
    const grouped = new Map<string, DraftItem[]>();
    for (const item of items) {
      const label = TYPE_CONFIG[item._type]?.label ?? "その他";
      grouped.set(label, [...(grouped.get(label) ?? []), item]);
    }
    return [...grouped.entries()];
  }, [items]);

  function openDraft(item: DraftItem) {
    const config = TYPE_CONFIG[item._type];
    if (!config?.tool) return;
    window.__yiaNavigateTo = {
      tool: config.tool,
      docId: item._id.replace(/^drafts\./, ""),
    };
    window.location.href = window.location.pathname.replace(/\/[^/]+$/, `/${config.tool}`);
  }

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <Box padding={4} style={{ borderBottom: "1px solid var(--card-border-color)" }}>
        <Flex align="center" justify="space-between" gap={3}>
          <div>
            <Text size={2} weight="semibold">
              未公開の変更
            </Text>
            <Text size={1} muted style={{ display: "block", marginTop: 6 }}>
              下書きがあるコンテンツをまとめて確認できます。公開は各編集画面から行います。
            </Text>
          </div>
          <Button
            icon={RefreshIcon}
            text="再読み込み"
            mode="ghost"
            onClick={fetchDrafts}
            disabled={loading}
          />
        </Flex>
      </Box>

      <div style={{ width: "min(920px, 100%)", margin: "0 auto", padding: 24 }}>
        {loading && items.length === 0 ? (
          <Flex align="center" justify="center" padding={5}>
            <LoadingDots />
          </Flex>
        ) : error ? (
          <Card tone="critical" padding={4} radius={2}>
            <Text size={1}>{error}</Text>
            <Button text="再読み込み" mode="ghost" tone="critical" onClick={fetchDrafts} />
          </Card>
        ) : items.length === 0 ? (
          <Card border padding={5} radius={2}>
            <Text size={2} weight="semibold">
              未公開の変更はありません
            </Text>
            <Text size={1} muted style={{ display: "block", marginTop: 8 }}>
              すべての変更が公開済みです。
            </Text>
          </Card>
        ) : (
          <Stack space={5}>
            <Text size={1} weight="semibold">
              {items.length}件の下書き
            </Text>
            {groups.map(([label, drafts]) => (
              <section key={label} aria-labelledby={`draft-group-${label}`}>
                <Text id={`draft-group-${label}`} size={1} weight="semibold">
                  {label}（{drafts.length}）
                </Text>
                <Stack space={2} style={{ marginTop: 8 }}>
                  {drafts.map((item) => {
                    const canOpen = !!TYPE_CONFIG[item._type]?.tool;
                    return (
                      <Card key={item._id} border radius={2} padding={3}>
                        <Flex align="center" justify="space-between" gap={3}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: fs.body, fontWeight: 600 }}>
                              {draftTitle(item)}
                            </div>
                            <div
                              style={{
                                fontSize: fs.meta,
                                color: "var(--card-muted-fg-color)",
                                marginTop: 4,
                              }}
                            >
                              下書きあり
                              {item._updatedAt ? `・${formatStudioRelativeTime(item._updatedAt)}` : ""}
                            </div>
                          </div>
                          {canOpen ? (
                            <Button
                              icon={LaunchIcon}
                              text="編集画面を開く"
                              mode="ghost"
                              onClick={() => openDraft(item)}
                            />
                          ) : null}
                        </Flex>
                      </Card>
                    );
                  })}
                </Stack>
              </section>
            ))}
          </Stack>
        )}
      </div>
    </div>
  );
}
