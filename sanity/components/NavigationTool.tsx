// sanity/components/NavigationTool.tsx
"use client";

import { useRef, useState } from "react";
import { Text } from "@sanity/ui";
import { RightPanel } from "./shared/RightPanel";
import { NavigationEditor, type NavigationEditorRef } from "./navigation/NavigationEditor";
import { AddPagePanel } from "./navigation/AddPagePanel";
import { ReorderPagesPanel } from "./navigation/ReorderPagesPanel";
import { AddCategoryPanel } from "./navigation/AddCategoryPanel";
import { RenameCategoryPanel } from "./navigation/RenameCategoryPanel";
import type { RightPanelState } from "./navigation/types";

export function NavigationTool() {
  const [rightPanel, setRightPanel] = useState<RightPanelState>(null);
  const editorRef = useRef<NavigationEditorRef>(null);

  function renderRightPanel() {
    const editor = editorRef.current;
    if (!rightPanel || !editor) return null;

    switch (rightPanel.type) {
      case "addPage":
        return (
          <AddPagePanel
            categoryKey={rightPanel.categoryKey}
            categories={editor.categories}
            allPages={editor.allPages}
            onAddPage={(catKey, pageId) => {
              editor.addPage(catKey, pageId);
            }}
            onClose={() => setRightPanel(null)}
          />
        );

      case "reorderPages": {
        const navCat = editor.categories.find((c) => c._key === rightPanel.categoryKey);
        if (!navCat) return null;
        return (
          <ReorderPagesPanel
            items={navCat.items ?? []}
            pagesMap={editor.pagesMap}
            onReorder={(reordered) => {
              editor.reorderPages(rightPanel.categoryKey, reordered);
            }}
            onClose={() => setRightPanel(null)}
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
