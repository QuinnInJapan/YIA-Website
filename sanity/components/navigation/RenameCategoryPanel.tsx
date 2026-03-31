// sanity/components/navigation/RenameCategoryPanel.tsx
"use client";

import { useCallback, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text } from "@sanity/ui";
import { BilingualInput } from "../shared/BilingualInput";
import type { I18nString } from "../homepage/types";
import type { CategoryDoc } from "./types";

export function RenameCategoryPanel({
  categoryDoc,
  onRenamed,
  onClose,
}: {
  categoryDoc: CategoryDoc;
  onRenamed: (categoryId: string, newLabel: I18nString[]) => void;
  onClose: () => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [label, setLabel] = useState<I18nString[]>(categoryDoc.label ?? []);
  const [saving, setSaving] = useState(false);

  const canSave = label.some((l) => l.value.trim());

  const handleSave = useCallback(async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      // Update the published category document directly
      await client.patch(categoryDoc._id).set({ label }).commit();
      // Also update draft if it exists
      const draftId = `drafts.${categoryDoc._id}`;
      const draft = await client.fetch(`*[_id == $id][0]._id`, { id: draftId });
      if (draft) {
        await client.patch(draftId).set({ label }).commit();
      }
      onRenamed(categoryDoc._id, label);
    } catch (err) {
      console.error("Failed to rename category:", err);
    } finally {
      setSaving(false);
    }
  }, [client, categoryDoc._id, label, canSave, saving, onRenamed]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box
        padding={3}
        style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}
      >
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            名前を変更
          </Text>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
              color: "var(--card-muted-fg-color)",
            }}
          >
            ✕
          </button>
        </Flex>
      </Box>

      {/* Form */}
      <div style={{ padding: 16 }}>
        <BilingualInput label="セクション名" value={label} onChange={setLabel} />
        <Button
          text={saving ? "保存中…" : "保存"}
          tone="positive"
          fontSize={1}
          padding={3}
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{ marginTop: 8 }}
        />
      </div>
    </div>
  );
}
