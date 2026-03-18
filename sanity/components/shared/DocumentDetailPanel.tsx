"use client";

import { useEffect, useMemo, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Label, Stack, Text, TextInput } from "@sanity/ui";
import { CloseIcon, DownloadIcon } from "@sanity/icons";
import { FileTypeIcon, formatFileSize, getFileType } from "./media-utils";
import { i18nGet, i18nSet } from "./i18n";

// ── Types ────────────────────────────────────────────────

export interface DocumentLinkItem {
  _key: string;
  _type?: "documentLink";
  label?: { _key: string; value: string }[];
  file?: { asset?: { _ref: string } };
  url?: string;
  type?: string;
  fileType?: string;
}

interface AssetInfo {
  _id: string;
  url: string;
  originalFilename: string | null;
  mimeType: string | null;
  size: number | null;
  extension: string | null;
}

// ── DocumentDetailPanel ──────────────────────────────────

export function DocumentDetailPanel({
  doc,
  onUpdate,
  onRemove,
  onChangeFile,
  onClose,
}: {
  doc: DocumentLinkItem;
  onUpdate: (updated: DocumentLinkItem) => void;
  onRemove: () => void;
  onChangeFile: () => void;
  onClose: () => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [asset, setAsset] = useState<AssetInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const assetRef = doc.file?.asset?._ref;
  const isUrl = !assetRef && !!doc.url;

  // Fetch asset info when ref changes
  useEffect(() => {
    if (!assetRef) {
      setAsset(null);
      return;
    }
    setLoading(true);
    setIframeLoaded(false);
    client
      .fetch<AssetInfo | null>(
        `*[_id == $id][0]{ _id, url, originalFilename, mimeType, size, extension }`,
        { id: assetRef },
      )
      .then(setAsset)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [client, assetRef]);

  const isPdf = asset?.mimeType === "application/pdf";
  const isImage = asset?.mimeType?.startsWith("image/") ?? false;
  const ft = useMemo(
    () => getFileType(asset?.mimeType ?? null, asset?.extension),
    [asset?.mimeType, asset?.extension],
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box
        padding={3}
        style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}
      >
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            資料の詳細
          </Text>
          <Button icon={CloseIcon} mode="bleed" fontSize={1} padding={2} onClick={onClose} />
        </Flex>
      </Box>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <Stack space={4}>
          {/* Preview */}
          {loading ? (
            <div
              style={{
                height: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 4,
                background: "var(--card-border-color)",
              }}
            >
              <Text size={1} muted>
                読み込み中…
              </Text>
            </div>
          ) : asset ? (
            isPdf ? (
              <div style={{ position: "relative" }}>
                {!iframeLoaded && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 4,
                      background: "rgba(255, 255, 255, 0.85)",
                      zIndex: 1,
                    }}
                  >
                    <Text size={1} muted>
                      読み込み中…
                    </Text>
                  </div>
                )}
                <iframe
                  src={asset.url}
                  title={asset.originalFilename ?? "PDF"}
                  onLoad={() => setIframeLoaded(true)}
                  style={{
                    width: "100%",
                    height: 500,
                    borderRadius: 4,
                    border: "1px solid var(--card-border-color)",
                    display: "block",
                  }}
                />
              </div>
            ) : isImage ? (
              <img
                src={`${asset.url}?w=600&auto=format`}
                alt={asset.originalFilename ?? ""}
                style={{
                  width: "100%",
                  borderRadius: 4,
                  border: "1px solid var(--card-border-color)",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "32px 16px",
                  borderRadius: 4,
                  background: ft.bgColor,
                  border: `1px solid ${ft.color}20`,
                }}
              >
                <FileTypeIcon mimeType={asset.mimeType} ext={asset.extension} size={80} />
              </div>
            )
          ) : isUrl ? (
            <div
              style={{
                padding: "24px 16px",
                borderRadius: 4,
                background: "#f0f2f5",
                border: "1px solid #e0e0e0",
                textAlign: "center",
              }}
            >
              <Text size={1} muted>
                外部リンク
              </Text>
            </div>
          ) : null}

          {/* Title editing */}
          <Stack space={2}>
            <Label size={0}>表示名</Label>
            <TextInput
              value={i18nGet(doc.label, "ja")}
              onChange={(e) =>
                onUpdate({
                  ...doc,
                  label: i18nSet(doc.label, "ja", e.currentTarget.value),
                })
              }
              placeholder="表示名を入力"
              fontSize={1}
            />
          </Stack>

          {/* File info */}
          {asset && (
            <Stack space={3}>
              <Stack space={1}>
                <Label size={0}>ファイル名</Label>
                <Text size={1}>{asset.originalFilename ?? "—"}</Text>
              </Stack>
              <Stack space={1}>
                <Label size={0}>サイズ</Label>
                <Text size={1}>{formatFileSize(asset.size)}</Text>
              </Stack>
              <Stack space={1}>
                <Label size={0}>種類</Label>
                <Text size={1}>{ft.label}</Text>
              </Stack>
            </Stack>
          )}

          {isUrl && doc.url && (
            <Stack space={1}>
              <Label size={0}>URL</Label>
              <Text size={1} style={{ wordBreak: "break-all" }}>
                {doc.url}
              </Text>
            </Stack>
          )}

          {/* Actions */}
          <Stack space={2}>
            {asset && (
              <Flex gap={2}>
                <Button
                  icon={DownloadIcon}
                  text="ダウンロード"
                  mode="ghost"
                  fontSize={1}
                  padding={2}
                  as="a"
                  href={`${asset.url}?dl=${asset.originalFilename ?? ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
                <Button
                  text="ファイルを変更"
                  mode="ghost"
                  fontSize={1}
                  padding={2}
                  onClick={onChangeFile}
                />
              </Flex>
            )}

            <Button
              text="この資料を削除"
              mode="ghost"
              tone="critical"
              fontSize={1}
              padding={2}
              onClick={onRemove}
            />
          </Stack>
        </Stack>
      </div>
    </div>
  );
}
