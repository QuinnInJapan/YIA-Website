// sanity/components/navigation/EditCategoryPanel.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import { Box, Flex, Text } from "@sanity/ui";
import { useClient } from "sanity";
import createImageUrlBuilder from "@sanity/image-url";
import { i18nGet } from "../shared/i18n";
import { ImageOverlayActions, OverlayButton, EmptyImageSlot } from "../homepage/HeroSection";
import { ImagePickerPanel } from "../shared/ImagePickerPanel";
import { DragHandle } from "./DragHandle";
import type { HotspotCropValue } from "../shared/HotspotCropTool";
import type { NavCategoryRaw, NavItemRaw, CategoryDoc, PageDoc } from "./types";

export function EditCategoryPanel({
  navCategory,
  categoryDoc,
  pagesMap,
  onTogglePageHidden,
  onRemovePage,
  onReorder,
  onAddPage,
  onHeroImageChanged,
  onShowHotspotCrop,
  onClose,
}: {
  navCategory: NavCategoryRaw;
  categoryDoc: CategoryDoc | undefined;
  pagesMap: Map<string, PageDoc>;
  onTogglePageHidden: (itemKey: string) => void;
  onRemovePage: (itemKey: string) => void;
  onReorder: (reordered: NavItemRaw[]) => void;
  onAddPage: () => void;
  onHeroImageChanged: (assetRef: string) => Promise<void>;
  onShowHotspotCrop: (
    imageUrl: string,
    value: HotspotCropValue,
    onChange: (v: HotspotCropValue) => void,
  ) => void;
  onClose: () => void;
}) {
  const [localItems, setLocalItems] = useState<NavItemRaw[]>(navCategory.items ?? []);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [localHeroAssetRef, setLocalHeroAssetRef] = useState<string | null>(null);

  const dragIdxRef = useRef<number | null>(null);

  const labelJa = i18nGet(categoryDoc?.label, "ja") || "Untitled";

  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(() => createImageUrlBuilder(client), [client]);

  const heroUrl = useMemo(() => {
    const assetRef = localHeroAssetRef ?? categoryDoc?.heroImage?.asset?._ref;
    if (!assetRef) return null;
    const imageSource = localHeroAssetRef
      ? { _type: "image", asset: { _ref: localHeroAssetRef } }
      : categoryDoc!.heroImage!;
    return builder.image(imageSource).width(600).height(338).fit("crop").auto("format").url();
  }, [localHeroAssetRef, categoryDoc, builder]);

  function handleToggleHidden(itemKey: string) {
    setLocalItems((prev) =>
      prev.map((item) => (item._key === itemKey ? { ...item, hidden: !item.hidden } : item)),
    );
    onTogglePageHidden(itemKey);
  }

  function handleRemove(itemKey: string) {
    setLocalItems((prev) => prev.filter((item) => item._key !== itemKey));
    onRemovePage(itemKey);
  }

  function handleCrop() {
    if (!heroUrl) return;
    onShowHotspotCrop(
      heroUrl,
      {
        hotspot: categoryDoc?.heroImage?.hotspot ?? { x: 0.5, y: 0.5, width: 0.3, height: 0.3 },
        crop: categoryDoc?.heroImage?.crop ?? { top: 0, bottom: 0, left: 0, right: 0 },
      },
      () => {},
    );
  }

  // Page drag-and-drop
  function handlePageDragStart(idx: number) {
    dragIdxRef.current = idx;
  }

  function handlePageDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    const fromIdx = dragIdxRef.current;
    if (fromIdx === null || fromIdx === idx) return;
    const next = [...localItems];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(idx, 0, moved);
    setLocalItems(next);
    dragIdxRef.current = idx;
  }

  function handlePageDragEnd() {
    onReorder(localItems);
    dragIdxRef.current = null;
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
            {labelJa}
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

      {/* Hero image section */}
      <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
        <div
          style={{
            fontSize: 12,
            color: "var(--card-muted-fg-color)",
            marginBottom: 6,
          }}
        >
          画像
        </div>
        <div
          style={{
            width: "100%",
            aspectRatio: "16/6",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          {heroUrl ? (
            <ImageOverlayActions
              buttons={
                <>
                  <OverlayButton label="変更" onClick={() => setShowImagePicker((v) => !v)} />
                  <OverlayButton label="切り抜き" onClick={handleCrop} />
                </>
              }
            >
              <img
                src={heroUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </ImageOverlayActions>
          ) : (
            <EmptyImageSlot onClick={() => setShowImagePicker(true)} />
          )}
        </div>
      </div>

      {/* Image picker (replaces page list when open) */}
      {showImagePicker && (
        <div style={{ flex: 1, overflow: "hidden" }}>
          <ImagePickerPanel
            onSelect={async (assetRef) => {
              await onHeroImageChanged(assetRef);
              setLocalHeroAssetRef(assetRef);
              setShowImagePicker(false);
            }}
            onClose={() => setShowImagePicker(false)}
          />
        </div>
      )}

      {/* Page list */}
      {!showImagePicker && (
        <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
          <div
            style={{
              fontSize: 12,
              color: "var(--card-muted-fg-color)",
              marginBottom: 6,
              padding: "0 16px",
            }}
          >
            ページ
          </div>
          {localItems.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center" }}>
              <Text size={1} muted>
                ページがありません
              </Text>
            </div>
          ) : (
            localItems.map((item, idx) => {
              const pageDoc = pagesMap.get(item.pageRef?._ref);
              const title = i18nGet(pageDoc?.title, "ja") || "Untitled";
              return (
                <div
                  key={item._key}
                  draggable
                  onDragStart={() => handlePageDragStart(idx)}
                  onDragOver={(e) => handlePageDragOver(e, idx)}
                  onDragEnd={handlePageDragEnd}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 16px",
                    gap: 6,
                    borderBottom: "1px solid var(--card-border-color)",
                    userSelect: "none",
                    cursor: "grab",
                  }}
                >
                  <DragHandle />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: item.hidden ? "var(--card-muted-fg-color)" : "var(--card-fg-color)",
                    }}
                  >
                    {title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleHidden(item._key)}
                    style={{
                      border: "1px solid var(--card-border-color)",
                      borderRadius: 4,
                      background: item.hidden
                        ? "var(--card-bg-color)"
                        : "var(--card-badge-default-bg-color, #e6f0e6)",
                      color: item.hidden
                        ? "var(--card-muted-fg-color)"
                        : "var(--card-badge-default-fg-color, #2d6a2d)",
                      cursor: "pointer",
                      padding: "2px 8px",
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {item.hidden ? "非表示" : "表示中"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(item._key)}
                    title="このページを削除"
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: 14,
                      color: "var(--card-muted-fg-color)",
                      padding: "2px 4px",
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Footer */}
      {!showImagePicker && (
        <Box padding={3} style={{ borderTop: "1px solid var(--card-border-color)", flexShrink: 0 }}>
          <button
            type="button"
            onClick={onAddPage}
            style={{
              fontSize: 13,
              padding: "8px 16px",
              border: "1px dashed var(--card-border-color)",
              borderRadius: 6,
              background: "transparent",
              cursor: "pointer",
              color: "var(--card-muted-fg-color)",
              width: "100%",
            }}
          >
            + ページを追加
          </button>
        </Box>
      )}
    </div>
  );
}
