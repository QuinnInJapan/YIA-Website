// sanity/components/navigation/AddCategoryPanel.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text } from "@sanity/ui";
import createImageUrlBuilder from "@sanity/image-url";
import { BilingualInput } from "../shared/BilingualInput";
import { ImagePickerPanel } from "../shared/ImagePickerPanel";
import type { I18nString } from "../homepage/types";

export function AddCategoryPanel({
  onCategoryCreated,
  onClose,
}: {
  onCategoryCreated: (categoryId: string) => void;
  onClose: () => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(() => createImageUrlBuilder(client), [client]);

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
      await client.createOrReplace({
        _id: categoryId,
        _type: "category",
        label,
        heroImage: {
          _type: "image",
          asset: { _type: "reference", _ref: heroImageRef! },
        },
      });
      onCategoryCreated(categoryId);
    } catch (err) {
      console.error("Failed to create category:", err);
    } finally {
      setSaving(false);
    }
  }, [client, label, heroImageRef, canSave, saving, onCategoryCreated]);

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

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box
        padding={3}
        style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}
      >
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            セクションを追加
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

      {/* Form */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <BilingualInput label="セクション名" value={label} onChange={setLabel} />

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
            ヒーロー画像 *
          </div>
          {heroImageRef ? (
            <div
              style={{
                position: "relative",
                borderRadius: 6,
                overflow: "hidden",
                aspectRatio: "16/9",
                maxWidth: 300,
              }}
            >
              <img
                src={builder
                  .image(heroImageRef)
                  .width(400)
                  .height(225)
                  .fit("crop")
                  .auto("format")
                  .url()}
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
                  fontSize: 11,
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
                maxWidth: 300,
                aspectRatio: "16/9",
                border: "2px dashed var(--card-border-color)",
                borderRadius: 6,
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                color: "var(--card-muted-fg-color)",
              }}
            >
              画像を選択
            </button>
          )}
        </div>

        <Button
          text={saving ? "作成中…" : "セクションを作成"}
          tone="positive"
          fontSize={1}
          padding={3}
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{ marginTop: 8 }}
        />
      </div>
    </div>
  );
}
