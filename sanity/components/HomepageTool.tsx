"use client";

import { useCallback, useState } from "react";
import { ImagePickerPanel } from "./shared/ImagePickerPanel";
import { HotspotCropTool } from "./shared/HotspotCropTool";
import { HomepageEditor } from "./homepage/HomepageEditor";

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
        />
      </div>

      {/* Right: Image picker panel */}
      {imagePicker && (
        <div
          style={{
            width: 420,
            flexShrink: 0,
            borderLeft: "1px solid var(--card-border-color)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ImagePickerPanel
            onSelect={(assetId) => {
              imagePicker.onSelect(assetId);
              setImagePicker(null);
            }}
            onClose={() => setImagePicker(null)}
          />
        </div>
      )}

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
