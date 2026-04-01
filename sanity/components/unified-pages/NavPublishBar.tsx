// sanity/components/unified-pages/NavPublishBar.tsx
"use client";

import { Button, Flex, Text } from "@sanity/ui";
import { PublishIcon } from "@sanity/icons";
import type { NavSaveStatus } from "./useNavData";

export function NavPublishBar({
  saveStatus,
  hasDraft,
  saving,
  onPublish,
}: {
  saveStatus: NavSaveStatus;
  hasDraft: boolean;
  saving: boolean;
  onPublish: () => void;
}) {
  if (!hasDraft && saveStatus === "saved") return null;

  const statusLabel: Record<NavSaveStatus, string> = {
    saved: "保存済み",
    dirty: "未保存の変更があります",
    saving: "保存中…",
    error: "保存エラー",
  };
  const statusColor: Record<NavSaveStatus, string> = {
    saved: "var(--card-muted-fg-color)",
    dirty: "#b08000",
    saving: "var(--card-muted-fg-color)",
    error: "#cc3333",
  };

  return (
    <div
      style={{
        borderTop: "1px solid var(--card-border-color)",
        padding: "8px 12px",
        flexShrink: 0,
        background: "var(--card-bg-color)",
      }}
    >
      <Flex align="center" justify="space-between" gap={2}>
        <Text size={0} style={{ color: statusColor[saveStatus] }}>
          {hasDraft ? "ナビの変更があります" : statusLabel[saveStatus]}
        </Text>
        <Button
          icon={PublishIcon}
          text="公開する"
          tone="positive"
          fontSize={1}
          padding={2}
          onClick={onPublish}
          disabled={saving || !hasDraft}
        />
      </Flex>
    </div>
  );
}
