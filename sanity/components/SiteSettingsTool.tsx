"use client";

import { useCallback, useState } from "react";
import { HomepageEditor } from "./homepage/HomepageEditor";
import { FilePickerPanel } from "./shared/FilePickerPanel";
import { DocumentDetailPanel } from "./shared/DocumentDetailPanel";
import { RightPanel } from "./shared/RightPanel";
import type { DocumentLinkItem } from "./shared/document-link-types";

export function SiteSettingsTool() {
  const [rightPanel, setRightPanel] = useState<
    | { type: "filePicker"; onSelect: (assetId: string, filename: string, ext: string) => void }
    | {
        type: "documentDetail";
        doc: DocumentLinkItem;
        onUpdate: (doc: DocumentLinkItem) => void;
        onRemove: () => void;
      }
    | null
  >(null);

  const handleOpenFilePicker = useCallback(
    (onSelect: (assetId: string, filename: string, ext: string) => void) => {
      setRightPanel({ type: "filePicker", onSelect });
    },
    [],
  );

  const handleOpenDocumentDetail = useCallback(
    (doc: DocumentLinkItem, onUpdate: (doc: DocumentLinkItem) => void, onRemove: () => void) => {
      setRightPanel({ type: "documentDetail", doc, onUpdate, onRemove });
    },
    [],
  );

  return (
    <div className="studio-workspace">
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <HomepageEditor
          scope="settings"
          onOpenImagePicker={() => {}}
          onShowHotspotCrop={() => {}}
          onOpenFilePicker={handleOpenFilePicker}
          onOpenDocumentDetail={handleOpenDocumentDetail}
        />
      </div>

      {rightPanel ? (
        <RightPanel>
          {rightPanel.type === "filePicker" ? (
            <FilePickerPanel
              onSelect={(assetId, filename, ext) => {
                rightPanel.onSelect(assetId, filename, ext);
                setRightPanel(null);
              }}
              onClose={() => setRightPanel(null)}
            />
          ) : (
            <DocumentDetailPanel
              doc={rightPanel.doc}
              onUpdate={(updated) => {
                rightPanel.onUpdate(updated);
                setRightPanel((previous) =>
                  previous?.type === "documentDetail" ? { ...previous, doc: updated } : previous,
                );
              }}
              onRemove={() => {
                rightPanel.onRemove();
                setRightPanel(null);
              }}
              onChangeFile={() => {
                const { doc, onUpdate, onRemove } = rightPanel;
                setRightPanel({
                  type: "filePicker",
                  onSelect: (assetId, filename, ext) => {
                    const updated: DocumentLinkItem = {
                      ...doc,
                      file: { asset: { _ref: assetId } },
                      fileType: ext,
                    };
                    onUpdate(updated);
                    setRightPanel({ type: "documentDetail", doc: updated, onUpdate, onRemove });
                  },
                });
              }}
              onClose={() => setRightPanel(null)}
            />
          )}
        </RightPanel>
      ) : null}
    </div>
  );
}
