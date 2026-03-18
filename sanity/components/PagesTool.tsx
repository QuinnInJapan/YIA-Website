"use client";

import { useCallback, useRef, useState } from "react";
import { Flex, Text } from "@sanity/ui";
import { useDeepLink } from "./shared/useDeepLink";
import { ImagePickerPanel } from "./shared/ImagePickerPanel";
import { FilePickerPanel } from "./shared/FilePickerPanel";
import { CombinedGalleryPanel, type GalleryImageItem } from "./blog/GalleryPanel";
import {
  DocumentDetailPanel,
  type DocumentLinkItem as SharedDocumentLinkItem,
} from "./shared/DocumentDetailPanel";
import { PagesSidebar, type PagesSidebarHandle } from "./pages/PagesSidebar";
import { PageEditor } from "./pages/PageEditor";
import { PreviewPanel } from "./shared/PreviewPanel";
import { RightPanel } from "./shared/RightPanel";
import { PagePreview } from "./pages/PagePreview";
import { SectionPickerPanel } from "./pages/SectionPickerPanel";
import type { PageDoc, SectionTypeName } from "./pages/types";

export function PagesTool() {
  const deepLinkId = useDeepLink("pages");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(deepLinkId);
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
    | { type: "sectionPicker"; onSelect: (type: SectionTypeName) => void }
    | {
        type: "documentDetail";
        doc: SharedDocumentLinkItem;
        onUpdate: (doc: SharedDocumentLinkItem) => void;
        onRemove: () => void;
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

  const handleOpenDocumentDetail = useCallback(
    (
      doc: SharedDocumentLinkItem,
      onUpdate: (doc: SharedDocumentLinkItem) => void,
      onRemove: () => void,
    ) => {
      setRightPanel({ type: "documentDetail", doc, onUpdate, onRemove });
    },
    [],
  );

  const handleOpenSectionPicker = useCallback((onSelect: (type: SectionTypeName) => void) => {
    setRightPanel({ type: "sectionPicker", onSelect });
  }, []);

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

  const handleSelectPage = useCallback(
    (pageId: string) => {
      setSelectedPageId((prev) => {
        if (prev === pageId) return prev; // already viewing this page
        return pageId;
      });
      setMergedDoc((prev) => {
        if (selectedPageId === pageId) return prev; // keep existing doc
        return null;
      });
      setRightPanel(null);
    },
    [selectedPageId],
  );

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
            onOpenSectionPicker={handleOpenSectionPicker}
            onOpenGalleryEditor={handleOpenGalleryEditor}
            onOpenDocumentDetail={handleOpenDocumentDetail}
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

      {/* ── Right: Tool panel or Preview ── */}
      {rightPanel ? (
        <RightPanel>
          {rightPanel.type === "imagePicker" ? (
            <ImagePickerPanel
              onSelect={(assetId) => {
                rightPanel.onSelect(assetId);
                setRightPanel(null);
              }}
              onClose={() => setRightPanel(null)}
            />
          ) : rightPanel.type === "filePicker" ? (
            <FilePickerPanel
              onSelect={(assetId, filename, ext) => {
                rightPanel.onSelect(assetId, filename, ext);
                setRightPanel(null);
              }}
              onClose={() => setRightPanel(null)}
            />
          ) : rightPanel.type === "galleryEditor" ? (
            <CombinedGalleryPanel
              key={rightPanel.sectionKey}
              initialImages={rightPanel.initialImages}
              onUpdateImages={rightPanel.onUpdateImages}
              onClose={() => setRightPanel(null)}
            />
          ) : rightPanel.type === "sectionPicker" ? (
            <SectionPickerPanel
              onSelect={(type) => {
                rightPanel.onSelect(type);
                setRightPanel(null);
              }}
              onClose={() => setRightPanel(null)}
            />
          ) : rightPanel.type === "documentDetail" ? (
            <DocumentDetailPanel
              doc={rightPanel.doc}
              onUpdate={(updated) => {
                rightPanel.onUpdate(updated);
                setRightPanel((prev) =>
                  prev?.type === "documentDetail" ? { ...prev, doc: updated } : prev,
                );
              }}
              onRemove={() => {
                rightPanel.onRemove();
                setRightPanel(null);
              }}
              onChangeFile={() => {
                const { doc, onUpdate } = rightPanel;
                setRightPanel({
                  type: "filePicker",
                  onSelect: (assetId, filename, ext) => {
                    const updated: SharedDocumentLinkItem = {
                      ...doc,
                      file: { asset: { _ref: assetId } },
                      fileType: ext,
                    };
                    onUpdate(updated);
                    setRightPanel({
                      type: "documentDetail",
                      doc: updated,
                      onUpdate,
                      onRemove: rightPanel.onRemove,
                    });
                  },
                });
              }}
              onClose={() => setRightPanel(null)}
            />
          ) : null}
        </RightPanel>
      ) : mergedDoc ? (
        <RightPanel>
          <PreviewPanel>
            <PagePreview page={mergedDoc} />
          </PreviewPanel>
        </RightPanel>
      ) : null}
    </div>
  );
}
