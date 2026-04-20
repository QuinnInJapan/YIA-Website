// sanity/components/unified-pages/CategoryManagement.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { Box, Button, Flex, Text } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons";
import createImageUrlBuilder from "@sanity/image-url";
import { useClient } from "sanity";
import { BilingualInput } from "../shared/BilingualInput";
import { ImagePickerPanel } from "../shared/ImagePickerPanel";
import { HotspotCropTool } from "../shared/HotspotCropTool";
import type { HotspotCropValue } from "../shared/HotspotCropTool";
import type { NavCategoryRaw, NavItemRaw, NavPageDoc, CategoryDoc, ImageField } from "./types";
import { fs } from "@/sanity/lib/studioTokens";

export function CategoryManagement({
  navCat,
  categoryDoc,
  pagesMap,
  onTogglePageHidden,
  onRemovePage,
  onReorderPages,
  onAddPage,
  onHeroImageChanged,
  onCategoryRenamed,
  onDeleteCategory,
  onLiveItemsChange,
}: {
  navCat: NavCategoryRaw;
  categoryDoc: CategoryDoc | undefined;
  pagesMap: Map<string, NavPageDoc>;
  onTogglePageHidden: (itemKey: string) => void;
  onRemovePage: (itemKey: string) => void;
  onReorderPages: (newItems: NavItemRaw[]) => void;
  onAddPage: () => void;
  onHeroImageChanged: (categoryId: string, image: ImageField) => Promise<void>;
  onCategoryRenamed: (categoryId: string, newLabel: { _key: string; value: string }[]) => void;
  onDeleteCategory: () => void;
  onLiveItemsChange?: (items: NavItemRaw[] | null) => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = createImageUrlBuilder(client as Parameters<typeof createImageUrlBuilder>[0]);

  const [isReorderMode, setIsReorderMode] = useState(false);
  const [localItems, setLocalItems] = useState<NavItemRaw[]>(navCat.items ?? []);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showHotspot, setShowHotspot] = useState(false);
  const [hotspotValue, setHotspotValue] = useState<HotspotCropValue | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameLabel, setRenameLabel] = useState(categoryDoc?.label ?? []);
  const [renameSaving, setRenameSaving] = useState(false);

  const dragIdxRef = useRef<number | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  // Sync localItems when navCat.items changes externally
  const prevItemsRef = useRef(navCat.items);
  if (!isReorderMode && prevItemsRef.current !== navCat.items) {
    prevItemsRef.current = navCat.items;
    setLocalItems(navCat.items ?? []);
  }

  const displayItems = isReorderMode ? localItems : (navCat.items ?? []);
  const label = categoryDoc?.label?.find((l) => l._key === "ja")?.value ?? "（カテゴリ名なし）";
  const labelEn = categoryDoc?.label?.find((l) => l._key === "en")?.value;
  const heroImage = categoryDoc?.heroImage;
  const heroUrl = heroImage?.asset?._ref
    ? builder.image(heroImage.asset._ref).width(400).height(225).fit("crop").auto("format").url()
    : null;

  function handleDragStart(idx: number, key: string) {
    dragIdxRef.current = idx;
    setDraggingKey(key);
  }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    const fromIdx = dragIdxRef.current;
    if (fromIdx === null || fromIdx === idx) return;
    const next = [...localItems];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(idx, 0, moved);
    setLocalItems(next);
    onLiveItemsChange?.(next);
    dragIdxRef.current = idx;
  }
  function handleDragEnd() {
    dragIdxRef.current = null;
    setDraggingKey(null);
  }
  function handleCompleteReorder() {
    setIsReorderMode(false);
    onLiveItemsChange?.(null);
    onReorderPages(localItems);
  }

  async function handleSaveRename() {
    if (!categoryDoc) return;
    setRenameSaving(true);
    try {
      await client.patch(categoryDoc._id).set({ label: renameLabel }).commit();
      await client
        .patch(`drafts.${categoryDoc._id}`)
        .set({ label: renameLabel })
        .commit()
        .catch(() => {});
      onCategoryRenamed(categoryDoc._id, renameLabel);
      setIsRenaming(false);
    } catch (err) {
      console.error("Rename failed:", err);
    } finally {
      setRenameSaving(false);
    }
  }

  if (showImagePicker) {
    return (
      <ImagePickerPanel
        onSelect={(assetRef) => {
          if (categoryDoc) {
            onHeroImageChanged(categoryDoc._id, {
              _type: "image",
              asset: { _type: "reference", _ref: assetRef },
            });
          }
          setShowImagePicker(false);
        }}
        onClose={() => setShowImagePicker(false)}
      />
    );
  }

  if (showHotspot && heroImage && hotspotValue !== null && categoryDoc) {
    return (
      <HotspotCropTool
        imageUrl={heroUrl ?? ""}
        value={hotspotValue}
        onChange={(val) => {
          const updated: ImageField = {
            _type: "image",
            asset: heroImage.asset,
            hotspot: { _type: "sanity.imageHotspot", ...val.hotspot },
            crop: { _type: "sanity.imageCrop", ...val.crop },
          };
          onHeroImageChanged(categoryDoc._id, updated);
          setHotspotValue(val);
        }}
        onClose={() => setShowHotspot(false)}
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
        {isRenaming ? (
          <div>
            <BilingualInput label="カテゴリ名" value={renameLabel} onChange={setRenameLabel} />
            <Flex gap={2} style={{ marginTop: 8 }}>
              <Button
                text={renameSaving ? "保存中…" : "保存"}
                tone="positive"
                fontSize={1}
                padding={2}
                onClick={handleSaveRename}
                disabled={renameSaving}
              />
              <Button
                text="キャンセル"
                mode="ghost"
                fontSize={1}
                padding={2}
                onClick={() => {
                  setIsRenaming(false);
                  setRenameLabel(categoryDoc?.label ?? []);
                }}
              />
            </Flex>
          </div>
        ) : (
          <Flex align="flex-start" justify="space-between" gap={2}>
            <div>
              <Text size={1} weight="semibold">
                {label}
              </Text>
              {labelEn && (
                <Text size={0} muted style={{ marginTop: 3, display: "block" }}>
                  {labelEn}
                </Text>
              )}
            </div>
            <button
              type="button"
              disabled={!categoryDoc}
              onClick={() => {
                setRenameLabel(categoryDoc?.label ?? []);
                setIsRenaming(true);
              }}
              title="カテゴリ名を変更"
              style={{
                border: "none",
                background: "transparent",
                cursor: !categoryDoc ? "default" : "pointer",
                padding: "2px 4px",
                fontSize: fs.body,
                color: "var(--card-muted-fg-color)",
                flexShrink: 0,
                lineHeight: 1,
                opacity: !categoryDoc ? 0.3 : 1,
              }}
            >
              ✎
            </button>
          </Flex>
        )}
      </Box>

      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {/* Hero image */}
        <div style={{ marginBottom: 20 }}>
          <Text size={0} muted style={{ marginBottom: 8, display: "block" }}>
            カテゴリ画像
          </Text>
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
              <div style={{ position: "absolute", bottom: 6, right: 6, display: "flex", gap: 4 }}>
                <button
                  type="button"
                  onClick={() => {
                    setHotspotValue({
                      hotspot: { x: 0.5, y: 0.5, width: 1, height: 1 },
                      crop: { top: 0, bottom: 0, left: 0, right: 0 },
                    });
                    setShowHotspot(true);
                  }}
                  style={{
                    padding: "4px 8px",
                    fontSize: fs.meta,
                    border: "none",
                    borderRadius: 4,
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  トリミング
                </button>
                <button
                  type="button"
                  onClick={() => setShowImagePicker(true)}
                  style={{
                    padding: "4px 8px",
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

        {/* Pages list */}
        <div style={{ marginBottom: 16 }}>
          <Flex align="center" justify="space-between" style={{ marginBottom: 8 }}>
            <Text size={0} muted>
              ページの並び順
            </Text>
            <button
              type="button"
              onClick={isReorderMode ? handleCompleteReorder : () => setIsReorderMode(true)}
              style={{
                fontSize: fs.meta,
                padding: "3px 8px",
                border: "1px solid var(--card-border-color)",
                borderRadius: 4,
                background: isReorderMode ? "var(--blue-500, #2563eb)" : "transparent",
                color: isReorderMode ? "#fff" : "var(--card-muted-fg-color)",
                cursor: "pointer",
              }}
            >
              {isReorderMode ? "完了" : "並び替え"}
            </button>
          </Flex>
          {displayItems.map((item, idx) => {
            const page = pagesMap.get(item.pageRef._ref);
            if (!page) return null;
            const titleJa = page.title?.find((t) => t._key === "ja")?.value ?? "（タイトルなし）";
            return (
              <div
                key={item._key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  borderRadius: 4,
                  marginBottom: 2,
                  background: "var(--card-bg-color)",
                  border: "1px solid var(--card-border-color)",
                  opacity: draggingKey === item._key ? 0.4 : 1,
                  cursor: isReorderMode ? "grab" : "default",
                }}
                draggable={isReorderMode}
                onDragStart={isReorderMode ? () => handleDragStart(idx, item._key) : undefined}
                onDragOver={isReorderMode ? (e) => handleDragOver(e, idx) : undefined}
                onDragEnd={isReorderMode ? handleDragEnd : undefined}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: fs.body,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {titleJa}
                </span>
                <button
                  type="button"
                  onClick={() => onTogglePageHidden(item._key)}
                  style={{
                    fontSize: fs.meta,
                    padding: "2px 6px",
                    border: "1px solid var(--card-border-color)",
                    borderRadius: 3,
                    background: "transparent",
                    cursor: "pointer",
                    color: item.hidden ? "var(--card-muted-fg-color)" : "var(--green-600, #16a34a)",
                    flexShrink: 0,
                  }}
                >
                  {item.hidden ? "○ 非表示" : "● 表示中"}
                </button>
                {!isReorderMode && (
                  <button
                    type="button"
                    onClick={() => onRemovePage(item._key)}
                    title="このカテゴリから削除"
                    style={{
                      fontSize: fs.meta,
                      padding: "2px 4px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "var(--card-muted-fg-color)",
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onAddPage}
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: fs.body,
            border: "1px dashed var(--card-border-color)",
            borderRadius: 6,
            background: "transparent",
            cursor: "pointer",
            color: "var(--card-muted-fg-color)",
            marginBottom: 24,
          }}
        >
          + ページを追加
        </button>

        {/* Danger zone */}
        <div
          style={{
            borderTop: "1px solid var(--card-border-color)",
            paddingTop: 16,
            marginBottom: 16,
          }}
        >
          <Flex align="center" justify="flex-end">
            <Button
              icon={TrashIcon}
              text="削除"
              tone="critical"
              mode="ghost"
              fontSize={1}
              padding={2}
              onClick={onDeleteCategory}
            />
          </Flex>
        </div>
      </div>
    </div>
  );
}
