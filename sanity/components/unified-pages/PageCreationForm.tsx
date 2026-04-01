// sanity/components/unified-pages/PageCreationForm.tsx
"use client";

import { useCallback, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text, TextInput } from "@sanity/ui";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 96); // leave room for uniqueness suffix if needed
}

export function PageCreationForm({
  categoryKey: _categoryKey,
  categoryShortId,
  onCreated,
  onCancel,
}: {
  categoryKey: string;
  categoryShortId: string; // for URL preview (e.g. "services")
  onCreated: (pageId: string) => void;
  onCancel: () => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });

  const [titleEn, setTitleEn] = useState("");
  const [titleJa, setTitleJa] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = slugify(titleEn);
  const urlPreview = slug ? `/${categoryShortId}/${slug}` : "";
  const canSave = titleEn.trim() && titleJa.trim() && slug;

  const handleCreate = useCallback(async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      // Check for slug collision
      const existing = await client.fetch<{ _id: string } | null>(
        `*[_type == "page" && slug == $slug][0]{ _id }`,
        { slug },
      );
      if (existing) {
        setError(`このURLはすでに使用されています: /${categoryShortId}/${slug}`);
        setSaving(false);
        return;
      }
      const pageId = `page-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
      await client.create({
        _id: pageId,
        _type: "page",
        slug,
        title: [
          { _key: "ja", value: titleJa },
          { _key: "en", value: titleEn },
        ],
      });
      onCreated(pageId);
    } catch (err) {
      console.error("Page creation failed:", err);
      setError("ページの作成に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }, [client, titleEn, titleJa, slug, categoryShortId, canSave, saving, onCreated]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box
        padding={3}
        style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}
      >
        <Text size={1} weight="semibold">
          新しいページを作成
        </Text>
      </Box>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--card-muted-fg-color)",
              marginBottom: 6,
            }}
          >
            英語タイトル（URLの元になります）*
          </label>
          <TextInput
            value={titleEn}
            onChange={(e) => setTitleEn((e.target as HTMLInputElement).value)}
            placeholder="e.g. Japanese Classes"
          />
          {slug && (
            <div style={{ fontSize: 11, color: "var(--card-muted-fg-color)", marginTop: 4 }}>
              URL: <span style={{ fontFamily: "monospace" }}>{urlPreview}</span>
            </div>
          )}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--card-muted-fg-color)",
              marginBottom: 6,
            }}
          >
            日本語タイトル *
          </label>
          <TextInput
            value={titleJa}
            onChange={(e) => setTitleJa((e.target as HTMLInputElement).value)}
            placeholder="例：日本語クラス"
          />
        </div>
        <div
          style={{
            padding: "10px 12px",
            background: "var(--yellow-100, #fef9c3)",
            borderRadius: 6,
            fontSize: 12,
            color: "var(--card-fg-color)",
            marginBottom: 16,
          }}
        >
          作成後、非表示に設定されます。内容を入力してから表示に切り替えてください。
        </div>
        {error && (
          <div
            style={{
              padding: "8px 12px",
              background: "var(--red-50, #fef2f2)",
              borderRadius: 6,
              fontSize: 12,
              color: "#dc2626",
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}
        <Flex gap={2}>
          <Button
            text={saving ? "作成中…" : "作成する"}
            tone="positive"
            fontSize={1}
            padding={3}
            onClick={handleCreate}
            disabled={!canSave || saving}
          />
          <Button text="キャンセル" mode="ghost" fontSize={1} padding={3} onClick={onCancel} />
        </Flex>
      </div>
    </div>
  );
}
