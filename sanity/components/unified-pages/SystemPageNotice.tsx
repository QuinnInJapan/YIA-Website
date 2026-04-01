"use client";

import { Box, Button, Flex, Text } from "@sanity/ui";
import { SYSTEM_PAGES } from "./types";

export function SystemPageNotice({
  name,
  onNavigateToTool,
}: {
  name: "blog" | "announcements";
  onNavigateToTool: (toolName: string) => void;
}) {
  const config = SYSTEM_PAGES.find((sp) => sp.name === name);
  if (!config) return null;

  return (
    <Flex align="center" justify="center" style={{ height: "100%", padding: 32 }}>
      <Box style={{ maxWidth: 360, textAlign: "center" }}>
        <Text size={1} weight="semibold" style={{ marginBottom: 12, display: "block" }}>
          {config.label}
        </Text>
        <Text size={1} muted style={{ marginBottom: 20, display: "block", lineHeight: 1.6 }}>
          このページはシステムで管理されています。
          <br />
          内容を編集するには、{config.toolTitle}をご利用ください。
        </Text>
        <Button
          text={`${config.toolTitle}へ →`}
          tone="primary"
          fontSize={1}
          padding={3}
          onClick={() => onNavigateToTool(config.toolName)}
        />
      </Box>
    </Flex>
  );
}
