"use client";

import { useCallback, useMemo, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text } from "@sanity/ui";
import createImageUrlBuilder from "@sanity/image-url";
import { fs } from "@/sanity/lib/studioTokens";
import { BilingualInput } from "../shared/BilingualInput";
import { ImagePickerPanel } from "../shared/ImagePickerPanel";
import type { I18nString, CategoryDoc } from "./types";

export function CategoryCreationForm({
  onCreated,
  onCancel,
}: {
  onCreated: (categoryId: string, categoryDoc: CategoryDoc) => void;
  onCancel: () => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(
    () => createImageUrlBuilder(client as Parameters<typeof createImageUrlBuilder>[0]),
    [client],
  );

  const [label, setLabel] = useState<I18nString[]>([]);
  const [heroImageRef, setHeroImageRef] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const canSave = label.some((l) => l.value.trim()) && !!heroImageRef;

  const handleSave = useCallback(async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const categoryId = `category-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
      const heroImage = {
        _type: "image",
        asset: { _type: "reference", _ref: heroImageRef! },
      };
      await client.createOrReplace({
        _id: categoryId,
        _type: "category",
        label,
        heroImage,
      });
      const categoryDoc: CategoryDoc = {
        _id: categoryId,
        _type: "category",
        label,
        heroImage,
      };
      onCreated(categoryId, categoryDoc);
    } catch (err) {
      console.error("Failed to create category:", err);
    } finally {
      setSaving(false);
    }
  }, [client, label, heroImageRef, canSave, saving, onCreated]);

  if (showImagePicker) {
    return (
      <ImagePickerPanel
        onSelect={(assetId) => {
          setHeroImageRef(assetId);
          setShowImagePicker(false);
        }}
        onClose={() => setShowImagePicker(false)}
      />
    );
  }

  const heroUrl = heroImageRef
    ? builder.image(heroImageRef).width(400).height(225).fit("crop").auto("format").url()
    : null;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box
        padding={3}
        style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}
      >
        <Text size={1} weight="semibold">
          新しいカテゴリを作成
        </Text>
      </Box>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <BilingualInput label="カテゴリ名" value={label} onChange={setLabel} />
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: fs.label, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
            ヒーロー画像 *
          </div>
          {heroUrl ? (
            <div
              style={{
                position: "relative",
                borderRadius: 6,
                overflow: "hidden",
                aspectRatio: "16/9",
                maxWidth: 320,
              }}
            >
              <img
                src={heroUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <button
                type="button"
                onClick={() => setShowImagePicker(true)}
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 6,
                  padding: "4px 10px",
                  fontSize: fs.meta,
                  border: "none",
                  borderRadius: 4,
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                変更
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowImagePicker(true)}
              style={{
                width: "100%",
                maxWidth: 320,
                aspectRatio: "16/9",
                border: "2px dashed var(--card-border-color)",
                borderRadius: 6,
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: fs.body,
                color: "var(--card-muted-fg-color)",
              }}
            >
              画像を選択
            </button>
          )}
        </div>
        <Flex gap={2}>
          <Button
            text={saving ? "作成中…" : "作成する"}
            tone="positive"
            fontSize={1}
            padding={3}
            onClick={handleSave}
            disabled={!canSave || saving}
          />
          <Button text="キャンセル" mode="ghost" fontSize={1} padding={3} onClick={onCancel} />
        </Flex>
      </div>
    </div>
  );
}
