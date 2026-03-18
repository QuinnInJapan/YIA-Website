"use client";

import { useCallback, useRef, useState } from "react";
import { Flex, Text } from "@sanity/ui";
import { ImagePickerPanel } from "./shared/ImagePickerPanel";
import { FilePickerPanel } from "./shared/FilePickerPanel";
import { CombinedGalleryPanel, type GalleryImageItem } from "./blog/GalleryPanel";
import { PagesSidebar, type PagesSidebarHandle } from "./pages/PagesSidebar";
import { PageEditor } from "./pages/PageEditor";
import { PreviewPanel } from "./shared/PreviewPanel";
import { RightPanel } from "./shared/RightPanel";
import { PagePreview } from "./pages/PagePreview";
import type { PageDoc } from "./pages/types";

export function PagesTool() {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [mergedDoc, setMergedDoc] = useState<PageDoc | null>(null);
  const sidebarRef = useRef<PagesSidebarHandle>(null);

  // Right panel state
  const [rightPanel, setRightPanel] = useState<
    | { type: "imagePicker"; onSelect: (assetId: string) => void }
    | { type: "filePicker"; onSelect: (assetId: string, filename: string, ext: string) => void }
    | {
        type: "galleryEditor";
        sectionKey: string;
        initialImages: GalleryImageItem[];
        onUpdateImages: (images: GalleryImageItem[]) => void;
      }
    | null
  >(null);

  const handleOpenImagePicker = useCallback((onSelect: (assetId: string) => void) => {
    setRightPanel({ type: "imagePicker", onSelect });
  }, []);

  const handleOpenFilePicker = useCallback(
    (onSelect: (assetId: string, filename: string, ext: string) => void) => {
      setRightPanel({ type: "filePicker", onSelect });
    },
    [],
  );

  const handleOpenGalleryEditor = useCallback(
    (
      sectionKey: string,
      images: GalleryImageItem[],
      onUpdate: (images: GalleryImageItem[]) => void,
    ) => {
      setRightPanel({
        type: "galleryEditor",
        sectionKey,
        initialImages: images,
        onUpdateImages: onUpdate,
      });
    },
    [],
  );

  const handleSelectPage = useCallback((pageId: string) => {
    setSelectedPageId(pageId);
    setMergedDoc(null);
    setRightPanel(null);
  }, []);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* ── Left: Sidebar ── */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          borderRight: "1px solid var(--card-border-color)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--card-border-color)",
          }}
        >
          <Text size={1} weight="semibold">
            ページ管理
          </Text>
        </div>
        <PagesSidebar
          ref={sidebarRef}
          selectedPageId={selectedPageId}
          onSelectPage={handleSelectPage}
        />
      </div>

      {/* ── Center: Editor ── */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        {selectedPageId ? (
          <PageEditor
            key={selectedPageId}
            documentId={selectedPageId}
            onOpenImagePicker={handleOpenImagePicker}
            onOpenFilePicker={handleOpenFilePicker}
            onOpenGalleryEditor={handleOpenGalleryEditor}
            activeGallerySectionKey={
              rightPanel?.type === "galleryEditor" ? rightPanel.sectionKey : null
            }
            onDeselectGallery={() => setRightPanel(null)}
            onMergedChange={setMergedDoc}
            onDraftChange={() => sidebarRef.current?.refresh()}
          />
        ) : (
          <Flex
            align="center"
            justify="center"
            direction="column"
            gap={4}
            style={{ height: "100%", color: "var(--card-muted-fg-color)" }}
          >
            <Text size={3} muted>
              ページを選択してください
            </Text>
          </Flex>
        )}
      </div>

      {/* ── Right: Image picker or Preview ── */}
      {rightPanel ? (
        <RightPanel>
          {rightPanel.type === "imagePicker" ? (
            <ImagePickerPanel onSelect={rightPanel.onSelect} onClose={() => setRightPanel(null)} />
          ) : rightPanel.type === "filePicker" ? (
            <FilePickerPanel onSelect={rightPanel.onSelect} onClose={() => setRightPanel(null)} />
          ) : rightPanel.type === "galleryEditor" ? (
            <CombinedGalleryPanel
              key={rightPanel.sectionKey}
              initialImages={rightPanel.initialImages}
              onUpdateImages={rightPanel.onUpdateImages}
              onClose={() => setRightPanel(null)}
            />
          ) : null}
        </RightPanel>
      ) : showPreview && mergedDoc ? (
        <RightPanel>
          <PreviewPanel onClose={() => setShowPreview(false)}>
            <PagePreview page={mergedDoc} />
          </PreviewPanel>
        </RightPanel>
      ) : !showPreview && mergedDoc ? (
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          style={{
            position: "absolute",
            right: 12,
            bottom: 12,
            padding: "8px 14px",
            border: "1px solid var(--card-border-color)",
            borderRadius: 6,
            background: "var(--card-bg-color)",
            color: "var(--card-fg-color)",
            fontSize: 12,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            zIndex: 10,
          }}
        >
          プレビューを表示
        </button>
      ) : null}
    </div>
  );
}
