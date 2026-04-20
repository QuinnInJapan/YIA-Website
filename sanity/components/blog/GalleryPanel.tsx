"use client";

import { useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text } from "@sanity/ui";
import createImageUrlBuilder from "@sanity/image-url";
import { fs } from "@/sanity/lib/studioTokens";
import { ImagePickerPanel } from "../shared/ImagePickerPanel";
import { i18nGet, i18nSet } from "../shared/i18n";

// ── Types ────────────────────────────────────────────────

export interface GalleryImageItem {
  _key: string;
  _type: "imageFile";
  file: { _type: "image"; asset: { _type: "reference"; _ref: string } };
  caption?: { _key: string; value: string }[];
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

  // Click-to-select for caption editing
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const didDragRef = useRef(false);

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
      const removed = images.find((img) => img.file?.asset?._ref === assetId);
      if (removed && removed._key === selectedKey) setSelectedKey(null);
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
                const isSelected = img._key === selectedKey;
                const hasCaption = !!i18nGet(img.caption, "ja") || !!i18nGet(img.caption, "en");
                return (
                  <div
                    key={img._key}
                    draggable
                    onDragStart={() => {
                      didDragRef.current = true;
                      dragIdxRef.current = idx;
                      setDraggingKey(img._key);
                    }}
                    onDragOver={(e) => handleStripDragOver(e, idx)}
                    onDragEnd={handleStripDragEnd}
                    onClick={() => {
                      if (didDragRef.current) {
                        didDragRef.current = false;
                        return;
                      }
                      setSelectedKey(isSelected ? null : img._key);
                    }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 4,
                      overflow: "hidden",
                      cursor: "grab",
                      opacity: isDragging ? 0.4 : 1,
                      border: isSelected
                        ? "2px solid var(--card-focus-ring-color, #4a90d9)"
                        : isDragging
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
                    {hasCaption && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: 2,
                          left: 2,
                          background: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          fontSize: 9 /* intentional: tiny badge */,
                          fontWeight: 700,
                          lineHeight: 1,
                          padding: "2px 3px",
                          borderRadius: 3,
                        }}
                      >
                        Aa
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (img._key === selectedKey) setSelectedKey(null);
                        commitImages(images.filter((i) => i._key !== img._key));
                      }}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        border: "none",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        fontSize: fs.meta,
                        lineHeight: 1,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Caption editor strip */}
      {selectedKey &&
        (() => {
          const selImg = images.find((img) => img._key === selectedKey);
          if (!selImg) return null;
          const ref = selImg.file?.asset?._ref;
          return (
            <div
              style={{
                borderBottom: "1px solid var(--card-border-color)",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--card-bg-color)",
              }}
            >
              {ref && (
                <img
                  src={builder.image(ref).width(96).height(96).fit("crop").auto("format").url()}
                  alt=""
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 4,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: fs.meta, fontWeight: 600, width: 24, flexShrink: 0 }}>
                    JA:
                  </span>
                  <input
                    type="text"
                    value={i18nGet(selImg.caption, "ja")}
                    onChange={(e) => {
                      const next = images.map((img) =>
                        img._key === selectedKey
                          ? { ...img, caption: i18nSet(img.caption, "ja", e.target.value) }
                          : img,
                      );
                      commitImages(next);
                    }}
                    placeholder="キャプション（日本語）"
                    style={{
                      flex: 1,
                      fontSize: fs.label,
                      padding: "4px 6px",
                      border: "1px solid var(--card-border-color)",
                      borderRadius: 3,
                      background: "var(--card-bg-color)",
                      color: "inherit",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: fs.meta, fontWeight: 600, width: 24, flexShrink: 0 }}>
                    EN:
                  </span>
                  <input
                    type="text"
                    value={i18nGet(selImg.caption, "en")}
                    onChange={(e) => {
                      const next = images.map((img) =>
                        img._key === selectedKey
                          ? { ...img, caption: i18nSet(img.caption, "en", e.target.value) }
                          : img,
                      );
                      commitImages(next);
                    }}
                    placeholder="Caption (English)"
                    style={{
                      flex: 1,
                      fontSize: fs.label,
                      padding: "4px 6px",
                      border: "1px solid var(--card-border-color)",
                      borderRadius: 3,
                      background: "var(--card-bg-color)",
                      color: "inherit",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })()}

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
