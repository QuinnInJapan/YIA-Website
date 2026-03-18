"use client";

import { useCallback, useState } from "react";
import { ImagePickerPanel } from "./shared/ImagePickerPanel";
import { HotspotCropTool } from "./shared/HotspotCropTool";
import { PreviewPanel } from "./shared/PreviewPanel";
import { RightPanel } from "./shared/RightPanel";
import { HomepageEditor } from "./homepage/HomepageEditor";
import { HomepagePreview, type HomepageMergedState } from "./homepage/HomepagePreview";

export function HomepageTool() {
  // Image picker state
  const [imagePicker, setImagePicker] = useState<{
    onSelect: (assetId: string) => void;
  } | null>(null);

  // Hotspot/crop state
  const [hotspotCrop, setHotspotCrop] = useState<{
    imageUrl: string;
    value: { hotspot: any; crop: any };
    onChange: (v: { hotspot: any; crop: any }) => void;
  } | null>(null);

  // Preview state
  const [mergedState, setMergedState] = useState<HomepageMergedState | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const handleOpenImagePicker = useCallback((onSelect: (assetId: string) => void) => {
    setImagePicker({ onSelect });
  }, []);

  const handleShowHotspotCrop = useCallback(
    (
      imageUrl: string,
      value: { hotspot: any; crop: any },
      onChange: (v: { hotspot: any; crop: any }) => void,
    ) => {
      setHotspotCrop({ imageUrl, value, onChange });
    },
    [],
  );

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Editor pane */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <HomepageEditor
          onOpenImagePicker={handleOpenImagePicker}
          onShowHotspotCrop={handleShowHotspotCrop}
          onMergedChange={setMergedState}
        />
      </div>

      {/* Right: Image picker > Preview > floating button */}
      {imagePicker ? (
        <RightPanel>
          <ImagePickerPanel
            onSelect={(assetId) => {
              imagePicker.onSelect(assetId);
              setImagePicker(null);
            }}
            onClose={() => setImagePicker(null)}
          />
        </RightPanel>
      ) : showPreview && mergedState ? (
        <RightPanel>
          <PreviewPanel onClose={() => setShowPreview(false)}>
            <HomepagePreview state={mergedState} />
          </PreviewPanel>
        </RightPanel>
      ) : !showPreview && mergedState ? (
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

      {/* Hotspot/crop dialog */}
      {hotspotCrop && (
        <HotspotCropTool
          imageUrl={hotspotCrop.imageUrl}
          value={hotspotCrop.value}
          onChange={(value) => {
            hotspotCrop.onChange(value);
          }}
          onClose={() => setHotspotCrop(null)}
        />
      )}
    </div>
  );
}
