// sanity/components/UnifiedPagesTool.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flex, Text } from "@sanity/ui";
import { useDeepLink } from "./shared/useDeepLink";
import { ImagePickerPanel } from "./shared/ImagePickerPanel";
import { FilePickerPanel } from "./shared/FilePickerPanel";
import { CombinedGalleryPanel, type GalleryImageItem } from "./blog/GalleryPanel";
import {
  DocumentDetailPanel,
  type DocumentLinkItem as SharedDocumentLinkItem,
} from "./shared/DocumentDetailPanel";
import { PreviewPanel } from "./shared/PreviewPanel";
import { RightPanel } from "./shared/RightPanel";
import { SectionPickerPanel } from "./pages/SectionPickerPanel";
import { PagePreview } from "./pages/PagePreview";
import { LeftPanel } from "./unified-pages/LeftPanel";
import { PageEditor } from "./unified-pages/PageEditor";
import { CategoryManagement } from "./unified-pages/CategoryManagement";
import { PageCreationForm } from "./unified-pages/PageCreationForm";
import { CategoryCreationForm } from "./unified-pages/CategoryCreationForm";
import { SystemPageNotice } from "./unified-pages/SystemPageNotice";
import { CategoryPreview } from "./unified-pages/CategoryPreview";
import { useNavData } from "./unified-pages/useNavData";
import { shortId } from "./unified-pages/types";
import type { MiddlePanelState } from "./unified-pages/types";
import type { SectionTypeName } from "./pages/types";
import type { PageDoc } from "./unified-pages/types";
import { useClient } from "sanity";

// Draft page IDs subscription query
const DRAFT_PAGE_IDS_QUERY = `*[_id in path("drafts.page-*")]._id`;

export function UnifiedPagesTool() {
  const deepLinkId = useDeepLink("pages");
  const [middlePanel, setMiddlePanel] = useState<MiddlePanelState>(
    deepLinkId ? { type: "page", id: deepLinkId } : null,
  );
  const [mergedDoc, setMergedDoc] = useState<PageDoc | null>(null);
  const [draftPageIds, setDraftPageIds] = useState<Set<string>>(new Set());

  const client = useClient({ apiVersion: "2024-01-01" });
  const sidebarRefreshRef = useRef<(() => void) | null>(null);

  // Subscribe to draft page changes for draft indicators
  useEffect(() => {
    const sub = client.listen('*[_type == "page"]').subscribe(() => {
      client.fetch<string[]>(DRAFT_PAGE_IDS_QUERY).then((ids) => {
        setDraftPageIds(new Set(ids.map((id) => id.replace("drafts.", ""))));
      });
    });
    // Initial load
    client.fetch<string[]>(DRAFT_PAGE_IDS_QUERY).then((ids) => {
      setDraftPageIds(new Set(ids.map((id) => id.replace("drafts.", ""))));
    });
    return () => sub.unsubscribe();
  }, [client]);

  const navData = useNavData();
  const [isReorderMode, setIsReorderMode] = useState(false);

  // Right panel state (section tools)
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

  const handleSelectPage = useCallback((id: string) => {
    setMiddlePanel({ type: "page", id });
    setRightPanel(null);
    setMergedDoc(null);
  }, []);

  const handleSelectCategory = useCallback((key: string) => {
    setMiddlePanel({ type: "category", key });
    setRightPanel(null);
    setMergedDoc(null);
  }, []);

  const handleSelectSystemPage = useCallback((name: "blog" | "announcements") => {
    setMiddlePanel({ type: "system", name });
    setRightPanel(null);
    setMergedDoc(null);
  }, []);

  const handleNavigateToTool = useCallback((toolName: string) => {
    // Navigate using Sanity's router
    window.location.href = window.location.pathname.replace(/\/[^/]+$/, `/${toolName}`);
  }, []);

  const handleCreateCategory = useCallback(() => {
    setMiddlePanel({ type: "createCategory" });
    setRightPanel(null);
  }, []);

  // Find category key for page creation
  const handleStartCreatePage = useCallback((categoryKey: string) => {
    setMiddlePanel({ type: "createPage", categoryKey });
    setRightPanel(null);
  }, []);

  const handlePageCreated = useCallback(
    async (pageId: string, categoryKey: string) => {
      // Add to navigation as hidden
      navData.addPageToNav(categoryKey, pageId);
      // Refresh pages in nav data
      await navData.refreshPages();
      // Open the new page in the editor
      setMiddlePanel({ type: "page", id: pageId });
    },
    [navData],
  );

  const handleCategoryCreated = useCallback(
    (categoryId: string, categoryDoc: import("./unified-pages/types").CategoryDoc) => {
      navData.addCategoryToNav(categoryId, categoryDoc);
      // Can't know the new key until state updates, so just clear panel
      setMiddlePanel(null);
    },
    [navData],
  );

  // ── Middle panel renderer ──────────────────────────────────

  function renderMiddlePanel() {
    if (!middlePanel) {
      return (
        <Flex
          align="center"
          justify="center"
          direction="column"
          gap={4}
          style={{ height: "100%", color: "var(--card-muted-fg-color)" }}
        >
          <Text size={2} muted>
            左のパネルからページまたはカテゴリを選択してください
          </Text>
        </Flex>
      );
    }

    switch (middlePanel.type) {
      case "page":
        return (
          <PageEditor
            key={middlePanel.id}
            documentId={middlePanel.id}
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
            onDraftChange={() => sidebarRefreshRef.current?.()}
          />
        );

      case "category": {
        const navCat = navData.categories.find((c) => c._key === middlePanel.key);
        const catDoc = navCat ? navData.categoryDocs.get(navCat.categoryRef?._ref) : undefined;
        if (!navCat)
          return (
            <Flex align="center" justify="center" style={{ height: "100%" }}>
              <Text muted>カテゴリが見つかりません</Text>
            </Flex>
          );
        return (
          <CategoryManagement
            key={middlePanel.key}
            navCat={navCat}
            categoryDoc={catDoc}
            pagesMap={navData.pagesMap}
            onTogglePageHidden={(itemKey) => navData.togglePageHidden(middlePanel.key, itemKey)}
            onRemovePage={(itemKey) => navData.removePage(middlePanel.key, itemKey)}
            onReorderPages={(newItems) => navData.publishPageReorder(middlePanel.key, newItems)}
            onAddPage={() => handleStartCreatePage(middlePanel.key)}
            onHeroImageChanged={navData.onHeroImageChanged}
            onCategoryRenamed={navData.handleCategoryRenamed}
            onDeleteCategory={() => {
              navData.deleteCategory(middlePanel.key);
              setMiddlePanel(null);
            }}
          />
        );
      }

      case "createPage": {
        const navCat = navData.categories.find((c) => c._key === middlePanel.categoryKey);
        const catShortId = navCat ? shortId(navCat.categoryRef._ref) : "unknown";
        return (
          <PageCreationForm
            categoryKey={middlePanel.categoryKey}
            categoryShortId={catShortId}
            onCreated={(pageId) => handlePageCreated(pageId, middlePanel.categoryKey)}
            onCancel={() => setMiddlePanel({ type: "category", key: middlePanel.categoryKey })}
          />
        );
      }

      case "createCategory":
        return (
          <CategoryCreationForm
            onCreated={handleCategoryCreated}
            onCancel={() => setMiddlePanel(null)}
          />
        );

      case "system":
        return <SystemPageNotice name={middlePanel.name} onNavigateToTool={handleNavigateToTool} />;

      default:
        return null;
    }
  }

  // ── Right panel renderer ───────────────────────────────────

  function renderRightPanel() {
    if (!rightPanel) {
      // Show preview when viewing a page and no tool panel open
      if (middlePanel?.type === "page" && mergedDoc) {
        return (
          <RightPanel>
            <PreviewPanel>
              <PagePreview page={mergedDoc} />
            </PreviewPanel>
          </RightPanel>
        );
      }
      // Show category page list preview when a category is selected
      if (middlePanel?.type === "category") {
        const navCat = navData.categories.find((c) => c._key === middlePanel.key);
        if (navCat) {
          const categoryDoc = navCat.categoryRef?._ref
            ? navData.categoryDocs.get(navCat.categoryRef._ref)
            : undefined;
          return (
            <RightPanel>
              <PreviewPanel>
                <CategoryPreview
                  navCat={navCat}
                  categoryDoc={categoryDoc}
                  pagesMap={navData.pagesMap}
                />
              </PreviewPanel>
            </RightPanel>
          );
        }
      }
      return null;
    }

    return (
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
    );
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* ── Left: Category tree ── */}
      <div
        style={{
          width: 340,
          flexShrink: 0,
          borderRight: "1px solid var(--card-border-color)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <LeftPanel
          loading={navData.loading}
          saveStatus={navData.saveStatus}
          categories={navData.categories}
          categoryDocs={navData.categoryDocs}
          pagesMap={navData.pagesMap}
          draftPageIds={draftPageIds}
          selectedMiddle={middlePanel}
          onSelectCategory={handleSelectCategory}
          onSelectPage={handleSelectPage}
          onSelectSystemPage={handleSelectSystemPage}
          onCreateCategory={handleCreateCategory}
          onReorderCategories={navData.publishCategoryReorder}
          onReorderModeChange={setIsReorderMode}
        />
      </div>

      {/* ── Center: Middle panel ── */}
      <div
        style={{
          flex: middlePanel?.type === "system" ? "0 0 480px" : 1,
          minWidth: 0,
          overflow: "hidden",
          opacity: isReorderMode ? 0.3 : 1,
          pointerEvents: isReorderMode ? "none" : "auto",
          transition: "opacity 0.15s",
        }}
      >
        {renderMiddlePanel()}
      </div>

      {/* ── Right: Section tools or preview ── */}
      {renderRightPanel()}
    </div>
  );
}
