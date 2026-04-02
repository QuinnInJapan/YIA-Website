"use client";

import { useCallback, useState } from "react";
import { ImagePickerPanel } from "./shared/ImagePickerPanel";
import { FilePickerPanel } from "./shared/FilePickerPanel";
import { HotspotCropTool } from "./shared/HotspotCropTool";
import {
  DocumentDetailPanel,
  type DocumentLinkItem as SharedDocumentLinkItem,
} from "./shared/DocumentDetailPanel";
import { PreviewPanel } from "./shared/PreviewPanel";
import { RightPanel } from "./shared/RightPanel";
import { HomepageEditor } from "./homepage/HomepageEditor";
import { HomepagePreview, type HomepageMergedState } from "./homepage/HomepagePreview";
import { FocusProvider } from "./shared/FocusContext";

export function HomepageTool() {
  // Right panel state
  const [rightPanel, setRightPanel] = useState<
    | { type: "imagePicker"; onSelect: (assetId: string) => void }
    | { type: "filePicker"; onSelect: (assetId: string, filename: string, ext: string) => void }
    | {
        type: "hotspotCrop";
        imageUrl: string;
        value: { hotspot: any; crop: any };
        onChange: (v: { hotspot: any; crop: any }) => void;
      }
    | {
        type: "documentDetail";
        doc: SharedDocumentLinkItem;
        onUpdate: (doc: SharedDocumentLinkItem) => void;
        onRemove: () => void;
      }
    | null
  >(null);

  // Preview state
  const [mergedState, setMergedState] = useState<HomepageMergedState | null>(null);

  const handleOpenImagePicker = useCallback((onSelect: (assetId: string) => void) => {
    setRightPanel({ type: "imagePicker", onSelect });
  }, []);

  const handleOpenFilePicker = useCallback(
    (onSelect: (assetId: string, filename: string, ext: string) => void) => {
      setRightPanel({ type: "filePicker", onSelect });
    },
    [],
  );

  const handleShowHotspotCrop = useCallback(
    (
      imageUrl: string,
      value: { hotspot: any; crop: any },
      onChange: (v: { hotspot: any; crop: any }) => void,
    ) => {
      setRightPanel({ type: "hotspotCrop", imageUrl, value, onChange });
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

  return (
    <FocusProvider>
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
        {/* Editor pane */}
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <HomepageEditor
            onOpenImagePicker={handleOpenImagePicker}
            onOpenFilePicker={handleOpenFilePicker}
            onShowHotspotCrop={handleShowHotspotCrop}
            onOpenDocumentDetail={handleOpenDocumentDetail}
            onMergedChange={setMergedState}
          />
        </div>

        {/* Right panel */}
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
              <FilePickerPanel onSelect={rightPanel.onSelect} onClose={() => setRightPanel(null)} />
            ) : rightPanel.type === "hotspotCrop" ? (
              <HotspotCropTool
                imageUrl={rightPanel.imageUrl}
                value={rightPanel.value}
                onChange={(value) => {
                  rightPanel.onChange(value);
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
        ) : mergedState ? (
          <RightPanel>
            <PreviewPanel>
              <HomepagePreview state={mergedState} />
            </PreviewPanel>
          </RightPanel>
        ) : null}
      </div>
    </FocusProvider>
  );
}
