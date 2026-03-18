"use client";

import { useEffect, useRef, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { AddIcon, SearchIcon } from "@sanity/icons";

// ── Types ────────────────────────────────────────────────

interface SanityFileAsset {
  _id: string;
  originalFilename: string | null;
  extension: string | null;
  size: number | null;
  mimeType: string | null;
}

// ── Constants ────────────────────────────────────────────

const PAGE_SIZE = 30;

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const EXT_COLORS: Record<string, string> = {
  pdf: "#e53935",
  doc: "#1565c0",
  docx: "#1565c0",
  xls: "#2e7d32",
  xlsx: "#2e7d32",
  csv: "#2e7d32",
  ppt: "#e65100",
  pptx: "#e65100",
  zip: "#6a1b9a",
};

// ── FilePickerPanel ─────────────────────────────────────

export function FilePickerPanel({
  onSelect,
  onClose,
}: {
  onSelect: (assetId: string, filename: string, ext: string) => void;
  onClose: () => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });

  const [assets, setAssets] = useState<SanityFileAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch files
  useEffect(() => {
    setLoading(true);
    let filter = `_type == "sanity.fileAsset" && !(_id in path("drafts.**"))`;
    if (searchQuery.trim()) {
      const terms = searchQuery
        .trim()
        .split(/\s+/)
        .map((t) => `"${t}*"`)
        .join(", ");
      filter += ` && (originalFilename match [${terms}])`;
    }
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    Promise.all([
      client.fetch<SanityFileAsset[]>(
        `*[${filter}] | order(_createdAt desc) [${start}...${end}] { _id, originalFilename, extension, size, mimeType }`,
      ),
      client.fetch<number>(`count(*[${filter}])`),
    ])
      .then(([items, count]) => {
        setAssets(items);
        setTotal(count);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [client, searchQuery, page]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      setSearchQuery(value);
    }, 300);
  }

  async function handleUpload() {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const asset = await client.assets.upload("file", file);
        const ext = file.name.split(".").pop()?.toUpperCase() ?? "";
        onSelect(asset._id, file.name.replace(/\.[^.]+$/, ""), ext);
      } catch (err) {
        console.error("Upload failed:", err);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  function handleSelect() {
    const asset = assets.find((a) => a._id === selectedId);
    if (!asset) return;
    const filename = asset.originalFilename?.replace(/\.[^.]+$/, "") ?? "";
    const ext = (asset.extension ?? "").toUpperCase();
    onSelect(asset._id, filename, ext);
    setSelectedId(null);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box padding={3} style={{ borderBottom: "1px solid var(--card-border-color)" }}>
        <Stack space={3}>
          <Flex align="center" justify="space-between">
            <Text size={1} weight="semibold">
              ファイルを選択
            </Text>
            <Flex align="center" gap={2}>
              <Button
                text="アップロード"
                icon={AddIcon}
                tone="primary"
                fontSize={0}
                padding={2}
                onClick={handleUpload}
                disabled={uploading}
              />
              <Button text="✕" mode="bleed" fontSize={0} padding={2} onClick={onClose} />
            </Flex>
          </Flex>
          <TextInput
            icon={SearchIcon}
            placeholder="ファイル名で検索…"
            value={search}
            onChange={(e) => handleSearchChange(e.currentTarget.value)}
            fontSize={0}
          />
          {uploading && (
            <Text size={0} muted>
              アップロード中…
            </Text>
          )}
        </Stack>
      </Box>

      {/* Selected file confirm bar */}
      {selectedId &&
        (() => {
          const selected = assets.find((a) => a._id === selectedId);
          if (!selected) return null;
          const ext = (selected.extension ?? "").toUpperCase();
          return (
            <div
              style={{
                borderBottom: "1px solid var(--card-border-color)",
                flexShrink: 0,
                padding: 12,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  background: EXT_COLORS[ext.toLowerCase()] ?? "#616161",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {ext || "FILE"}
              </div>
              <Stack space={1} style={{ flex: 1, minWidth: 0 }}>
                <Text size={1} textOverflow="ellipsis">
                  {selected.originalFilename ?? selected._id}
                </Text>
                <Text size={0} muted>
                  {formatFileSize(selected.size)}
                </Text>
              </Stack>
              <Flex align="center" gap={2} style={{ flexShrink: 0 }}>
                <Button
                  text="選択"
                  tone="primary"
                  fontSize={1}
                  padding={3}
                  onClick={handleSelect}
                />
                <Button
                  text="✕"
                  mode="bleed"
                  fontSize={1}
                  padding={3}
                  onClick={() => setSelectedId(null)}
                />
              </Flex>
            </div>
          );
        })()}

      {/* File list */}
      <Box flex={1} style={{ overflow: "auto", position: "relative" }}>
        {loading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: "var(--card-focus-ring-color, #4a90d9)",
              animation: "sidebarLoad 1.5s ease-in-out infinite",
              transformOrigin: "left",
              zIndex: 1,
            }}
          />
        )}

        <Box padding={3}>
          {!loading && assets.length === 0 ? (
            <Text size={1} muted>
              {searchQuery ? "検索結果がありません" : "ファイルがありません"}
            </Text>
          ) : (
            <Stack
              space={1}
              style={{ opacity: loading ? 0.5 : 1, transition: "opacity 150ms ease" }}
            >
              {assets.map((asset) => {
                const ext = (asset.extension ?? "").toUpperCase();
                const isSelected = asset._id === selectedId;
                return (
                  <button
                    key={asset._id}
                    type="button"
                    onClick={() => setSelectedId(asset._id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      border: isSelected
                        ? "1px solid var(--card-focus-ring-color, #4a90d9)"
                        : "1px solid transparent",
                      borderRadius: 4,
                      background: isSelected ? "var(--card-border-color)" : "transparent",
                      cursor: "pointer",
                      color: "var(--card-fg-color)",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 4,
                        background: EXT_COLORS[ext.toLowerCase()] ?? "#616161",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {ext || "FILE"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {asset.originalFilename ?? asset._id}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--card-muted-fg-color)" }}>
                        {formatFileSize(asset.size)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>

      {/* Pagination */}
      <Box padding={3} style={{ borderTop: "1px solid var(--card-border-color)" }}>
        <Flex align="center" justify="space-between">
          <Text size={0} muted>
            {total}件
          </Text>
          {totalPages > 1 && (
            <Flex align="center" gap={2}>
              <Button
                text="前へ"
                mode="ghost"
                fontSize={0}
                padding={2}
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
              />
              <Text size={0} muted>
                {page + 1} / {totalPages}
              </Text>
              <Button
                text="次へ"
                mode="ghost"
                fontSize={0}
                padding={2}
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
              />
            </Flex>
          )}
        </Flex>
      </Box>
    </div>
  );
}
