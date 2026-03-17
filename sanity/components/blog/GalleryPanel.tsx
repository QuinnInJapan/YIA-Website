"use client";

import { useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text } from "@sanity/ui";
import createImageUrlBuilder from "@sanity/image-url";
import { ImagePickerPanel } from "../shared/ImagePickerPanel";

// ── Types ────────────────────────────────────────────────

export interface GalleryImageItem {
  _key: string;
  _type: "imageFile";
  file: { _type: "image"; asset: { _type: "reference"; _ref: string } };
}

// ── CombinedGalleryPanel ─────────────────────────────────

export function CombinedGalleryPanel({
  initialImages,
  onUpdateImages,
  onClose,
}: {
  initialImages: GalleryImageItem[];
  onUpdateImages: (images: GalleryImageItem[]) => void;
  onClose: () => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(() => createImageUrlBuilder(client), [client]);

  const [images, setImages] = useState<GalleryImageItem[]>(initialImages);

  // Drag state for reorder strip
  const dragIdxRef = useRef<number | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  function commitImages(next: GalleryImageItem[]) {
    setImages(next);
    onUpdateImages(next);
  }

  function handleDeleteGallery() {
    commitImages([]);
    onClose();
  }

  // Toggle an image in/out of the gallery (used by the picker grid)
  function handleToggle(assetId: string) {
    const exists = images.some((img) => img.file?.asset?._ref === assetId);
    if (exists) {
      commitImages(images.filter((img) => img.file?.asset?._ref !== assetId));
    } else {
      const newItem: GalleryImageItem = {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        _type: "imageFile",
        file: {
          _type: "image",
          asset: { _type: "reference", _ref: assetId },
        },
      };
      commitImages([...images, newItem]);
    }
  }

  // Reorder strip drag handlers
  function handleStripDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    const fromIdx = dragIdxRef.current;
    if (fromIdx === null || fromIdx === idx) return;
    setImages((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(idx, 0, moved);
      return arr;
    });
    dragIdxRef.current = idx;
  }

  function handleStripDragEnd() {
    dragIdxRef.current = null;
    setDraggingKey(null);
    setImages((current) => {
      onUpdateImages(current);
      return current;
    });
  }

  const galleryAssetIds = useMemo(
    () => images.map((img) => img.file?.asset?._ref).filter(Boolean) as string[],
    [images],
  );

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box padding={3} style={{ borderBottom: "1px solid var(--card-border-color)" }}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            ギャラリー編集
          </Text>
          <Flex align="center" gap={2}>
            <Button
              text="ギャラリーを削除"
              mode="ghost"
              tone="critical"
              fontSize={0}
              padding={2}
              onClick={handleDeleteGallery}
            />
            <Button text="✕" mode="bleed" fontSize={0} padding={2} onClick={onClose} />
          </Flex>
        </Flex>
      </Box>

      {/* Reorder strip */}
      <div
        style={{
          borderBottom: "1px solid var(--card-border-color)",
          padding: "8px 12px",
          minHeight: 48,
          maxHeight: 240,
          overflowY: "auto",
        }}
      >
        <Text size={0} muted style={{ marginBottom: images.length > 0 ? 6 : 0 }}>
          {images.length === 0
            ? "下の画像をクリックしてギャラリーに追加してください"
            : `${images.length}枚を選択中 — ドラッグで並べ替え、下の画像をクリックで追加・削除`}
        </Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {images.length === 0
            ? null
            : images.map((img, idx) => {
                const ref = img.file?.asset?._ref;
                if (!ref) return null;
                const isDragging = img._key === draggingKey;
                return (
                  <div
                    key={img._key}
                    draggable
                    onDragStart={() => {
                      dragIdxRef.current = idx;
                      setDraggingKey(img._key);
                    }}
                    onDragOver={(e) => handleStripDragOver(e, idx)}
                    onDragEnd={handleStripDragEnd}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 4,
                      overflow: "hidden",
                      cursor: "grab",
                      opacity: isDragging ? 0.4 : 1,
                      border: isDragging
                        ? "2px solid var(--card-focus-ring-color, #4a90d9)"
                        : "1px solid var(--card-border-color)",
                      position: "relative",
                    }}
                  >
                    <img
                      src={builder
                        .image(ref)
                        .width(160)
                        .height(160)
                        .fit("crop")
                        .auto("format")
                        .url()}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                );
              })}
        </div>
      </div>

      {/* Image picker grid */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <ImagePickerPanel
          onClose={onClose}
          galleryMode={{
            selectedAssetIds: galleryAssetIds,
            onToggle: handleToggle,
          }}
        />
      </div>
    </div>
  );
}
