// sanity/components/NavigationTool.tsx
"use client";

import { useRef, useState } from "react";
import { Text } from "@sanity/ui";
import { RightPanel } from "./shared/RightPanel";
import { NavigationEditor, type NavigationEditorRef } from "./navigation/NavigationEditor";
import { EditCategoryPanel } from "./navigation/EditCategoryPanel";
import { AddPagePanel } from "./navigation/AddPagePanel";
import { AddCategoryPanel } from "./navigation/AddCategoryPanel";
import { RenameCategoryPanel } from "./navigation/RenameCategoryPanel";
import { ImagePickerPanel } from "./shared/ImagePickerPanel";
import type { RightPanelState } from "./navigation/types";

export function NavigationTool() {
  const [rightPanel, setRightPanel] = useState<RightPanelState>(null);
  const editorRef = useRef<NavigationEditorRef>(null);

  function renderRightPanel() {
    const editor = editorRef.current;
    if (!rightPanel || !editor) return null;

    switch (rightPanel.type) {
      case "editCategory": {
        const navCat = editor.categories.find((c) => c._key === rightPanel.categoryKey);
        const catDoc = navCat ? editor.categoryDocs.get(navCat.categoryRef?._ref) : undefined;
        if (!navCat) return null;
        return (
          <EditCategoryPanel
            navCategory={navCat}
            categoryDoc={catDoc}
            pagesMap={editor.pagesMap}
            onTogglePageHidden={(itemKey) =>
              editor.togglePageHidden(rightPanel.categoryKey, itemKey)
            }
            onRemovePage={(itemKey) => editor.removePage(rightPanel.categoryKey, itemKey)}
            onReorder={(reordered) => editor.reorderPages(rightPanel.categoryKey, reordered)}
            onAddPage={() =>
              setRightPanel({ type: "addPage", categoryKey: rightPanel.categoryKey })
            }
            onOpenPanel={setRightPanel}
            onClose={() => setRightPanel(null)}
          />
        );
      }

      case "addPage": {
        const addCategoryKey = rightPanel.categoryKey;
        return (
          <AddPagePanel
            categoryKey={addCategoryKey}
            categories={editor.categories}
            allPages={editor.allPages}
            onAddPage={(catKey, pageId) => {
              editor.addPage(catKey, pageId);
              // Defer so NavigationEditor re-renders and updates the ref before EditCategoryPanel mounts
              setTimeout(() => setRightPanel({ type: "editCategory", categoryKey: catKey }), 0);
            }}
            onClose={() => setRightPanel({ type: "editCategory", categoryKey: addCategoryKey })}
          />
        );
      }

      case "addCategory":
        return (
          <AddCategoryPanel
            onCategoryCreated={(categoryId) => {
              editor.addCategoryToNav(categoryId);
            }}
            onClose={() => setRightPanel(null)}
          />
        );

      case "renameCategory": {
        const renameCat = editor.categories.find((c) => c._key === rightPanel.categoryKey);
        const catDoc = renameCat ? editor.categoryDocs.get(renameCat.categoryRef?._ref) : undefined;
        if (!catDoc) return null;
        return (
          <RenameCategoryPanel
            categoryDoc={catDoc}
            onRenamed={(catId, newLabel) => {
              editor.handleCategoryRenamed(catId, newLabel);
            }}
            onClose={() => setRightPanel(null)}
          />
        );
      }

      case "changeHeroImage": {
        const changeCat = editor.categories.find((c) => c._key === rightPanel.categoryKey);
        const categoryId = changeCat?.categoryRef?._ref;
        if (!categoryId) return null;
        return (
          <ImagePickerPanel
            onSelect={async (assetRef) => {
              await editor.onHeroImageChanged(categoryId, assetRef);
              setRightPanel({ type: "editCategory", categoryKey: rightPanel.categoryKey });
            }}
            onClose={() =>
              setRightPanel({ type: "editCategory", categoryKey: rightPanel.categoryKey })
            }
          />
        );
      }

      default:
        return null;
    }
  }

  const panelContent = renderRightPanel();

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Editor pane */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <NavigationEditor ref={editorRef} onOpenPanel={setRightPanel} rightPanel={rightPanel} />
      </div>

      {/* Right panel */}
      {panelContent ? (
        <RightPanel>{panelContent}</RightPanel>
      ) : (
        <RightPanel>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: 24,
            }}
          >
            <Text size={1} muted style={{ textAlign: "center" }}>
              カテゴリーを選択してページを管理
              <br />
              <span style={{ fontSize: 12 }}>Select a section to manage its pages</span>
            </Text>
          </div>
        </RightPanel>
      )}
    </div>
  );
}
