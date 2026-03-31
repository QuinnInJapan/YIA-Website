"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { AddIcon, DownloadIcon, SearchIcon } from "@sanity/icons";
import createImageUrlBuilder from "@sanity/image-url";
import { FileTypeIcon, formatFileSize, getFileType } from "./media-utils";

// ── Types ────────────────────────────────────────────────

interface AssetItem {
  _id: string;
  _type: string;
  _createdAt: string;
  originalFilename: string | null;
  url: string;
  extension: string | null;
  mimeType: string | null;
  size: number | null;
  metadata?: { dimensions?: { width: number; height: number } } | null;
}

// ── Constants ────────────────────────────────────────────

const PAGE_SIZE = 30;

type TypeFilter = "images" | "pdf" | "docs" | "all";

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "images", label: "画像" },
  { value: "pdf", label: "PDF" },
  { value: "docs", label: "書類" },
  { value: "all", label: "すべて" },
];

function typeFilterGroq(filter: TypeFilter): string {
  switch (filter) {
    case "images":
      return `_type == "sanity.imageAsset"`;
    case "pdf":
      return `_type == "sanity.fileAsset" && mimeType == "application/pdf"`;
    case "docs":
      return `_type == "sanity.fileAsset" && mimeType != "application/pdf"`;
    case "all":
      return `_type in ["sanity.imageAsset", "sanity.fileAsset"]`;
  }
}

const PROJECTION = `{
  _id, _type, _createdAt, originalFilename, url, extension, mimeType, size,
  metadata { dimensions }
}`;

// ── Helpers ──────────────────────────────────────────────

function isImage(asset: AssetItem): boolean {
  return asset._type === "sanity.imageAsset" || (asset.mimeType?.startsWith("image/") ?? false);
}

function isPdf(asset: AssetItem): boolean {
  return asset.mimeType === "application/pdf";
}

// ── FilePickerPanel ──────────────────────────────────────

export function FilePickerPanel({
  onSelect,
  onClose,
  defaultFilter = "all",
}: {
  onSelect: (assetId: string, filename: string, ext: string) => void;
  onClose: () => void;
  defaultFilter?: TypeFilter;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = createImageUrlBuilder(client);

  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(defaultFilter);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch assets ─────────────────────────────────────

  const fetchAssets = useCallback(
    (currentPage: number, sq: string, tf: TypeFilter) => {
      setLoading(true);
      let filter = `${typeFilterGroq(tf)} && !(_id in path("drafts.**"))`;
      if (sq.trim()) {
        const terms = sq
          .trim()
          .split(/\s+/)
          .map((t) => `"${t}*"`)
          .join(", ");
        filter += ` && (originalFilename match [${terms}])`;
      }
      const start = currentPage * PAGE_SIZE;
      const end = start + PAGE_SIZE;

      Promise.all([
        client.fetch<AssetItem[]>(
          `*[${filter}] | order(_createdAt desc) [${start}...${end}] ${PROJECTION}`,
        ),
        client.fetch<number>(`count(*[${filter}])`),
      ])
        .then(([items, count]) => {
          setAssets(items);
          setTotal(count);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    },
    [client],
  );

  useEffect(() => {
    fetchAssets(page, searchQuery, typeFilter);
  }, [fetchAssets, page, searchQuery, typeFilter]);

  // ── Search ───────────────────────────────────────────

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      setSearchQuery(value);
    }, 300);
  }

  // ── Upload ───────────────────────────────────────────

  async function handleUpload() {
    const input = document.createElement("input");
    input.type = "file";
    if (typeFilter === "images") input.accept = "image/*";
    else if (typeFilter === "pdf") input.accept = "application/pdf";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const uploadType = file.type.startsWith("image/") ? "image" : "file";
        const asset = await client.assets.upload(uploadType as "image" | "file", file);
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

  // ── Select ───────────────────────────────────────────

  function handleConfirmSelect() {
    const asset = assets.find((a) => a._id === selectedId);
    if (!asset) return;
    const filename = asset.originalFilename?.replace(/\.[^.]+$/, "") ?? "";
    const ext = (asset.extension ?? "").toUpperCase();
    onSelect(asset._id, filename, ext);
    setSelectedId(null);
  }

  function handleSelectAsset(id: string) {
    setSelectedId(id);
    setIframeLoaded(false);
  }

  function handleFilterChange(f: TypeFilter) {
    setTypeFilter(f);
    setPage(0);
    setSelectedId(null);
    setIframeLoaded(false);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const selected = selectedId ? (assets.find((a) => a._id === selectedId) ?? null) : null;
  const showGrid = typeFilter === "images" || typeFilter === "all";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
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

          {/* Type filter tabs */}
          <Flex gap={1}>
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => handleFilterChange(f.value)}
                style={{
                  padding: "3px 10px",
                  border: "1px solid var(--card-border-color)",
                  borderRadius: 4,
                  background:
                    typeFilter === f.value
                      ? "var(--card-focus-ring-color, #1e3a5f)"
                      : "transparent",
                  color: typeFilter === f.value ? "#fff" : "var(--card-fg-color)",
                  fontSize: 11,
                  fontWeight: typeFilter === f.value ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}
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

      {/* Selected asset confirm bar */}
      {selected && (
        <div
          style={{
            borderBottom: "1px solid var(--card-border-color)",
            flexShrink: 0,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Preview area */}
          {isImage(selected) ? (
            <div
              style={{
                width: "100%",
                maxHeight: 200,
                borderRadius: 4,
                overflow: "hidden",
                background: "var(--card-border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={
                  selected._type === "sanity.imageAsset"
                    ? builder.image(selected._id).width(600).auto("format").url()
                    : selected.url
                }
                alt={selected.originalFilename ?? ""}
                style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain", display: "block" }}
              />
            </div>
          ) : isPdf(selected) ? (
            <div style={{ position: "relative" }}>
              {!iframeLoaded && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 4,
                    border: "1px solid var(--card-border-color)",
                    background: "var(--card-border-color)",
                    overflow: "hidden",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                      backgroundSize: "200% 100%",
                      animation: "skeletonShimmer 1.5s ease-in-out infinite",
                    }}
                  />
                  <style>{`@keyframes skeletonShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
                </div>
              )}
              <iframe
                src={selected.url}
                title={selected.originalFilename ?? "PDF"}
                onLoad={() => setIframeLoaded(true)}
                style={{
                  width: "100%",
                  height: 240,
                  borderRadius: 4,
                  border: "1px solid var(--card-border-color)",
                  display: "block",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                padding: "16px",
                borderRadius: 4,
                background: getFileType(selected.mimeType, selected.extension).bgColor,
                border: `1px solid ${getFileType(selected.mimeType, selected.extension).color}20`,
              }}
            >
              <FileTypeIcon mimeType={selected.mimeType} ext={selected.extension} size={64} />
              <Button
                as="a"
                href={`${selected.url}?dl=${selected.originalFilename ?? ""}`}
                target="_blank"
                rel="noopener noreferrer"
                icon={DownloadIcon}
                text="ダウンロードして確認"
                mode="ghost"
                fontSize={0}
                padding={2}
              />
            </div>
          )}

          {/* Metadata + action */}
          <Flex align="center" gap={3}>
            <Stack space={1} style={{ flex: 1, minWidth: 0 }}>
              <Text size={1} textOverflow="ellipsis">
                {selected.originalFilename ?? selected._id}
              </Text>
              <Text size={0} muted>
                {formatFileSize(selected.size)}
                {selected.metadata?.dimensions &&
                  ` · ${selected.metadata.dimensions.width}×${selected.metadata.dimensions.height}`}
              </Text>
            </Stack>
            <Flex align="center" gap={2} style={{ flexShrink: 0 }}>
              <Button
                text="選択"
                tone="primary"
                fontSize={1}
                padding={3}
                onClick={handleConfirmSelect}
              />
              <Button
                text="✕"
                mode="bleed"
                fontSize={1}
                padding={3}
                onClick={() => setSelectedId(null)}
              />
            </Flex>
          </Flex>
        </div>
      )}

      {/* Asset grid / list */}
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
          ) : showGrid ? (
            /* ── Grid view (images, mixed) ────────────── */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 8,
                opacity: loading ? 0.5 : 1,
                transition: "opacity 150ms ease",
              }}
            >
              {assets.map((asset) => {
                const isSelected = asset._id === selectedId;
                return (
                  <button
                    key={asset._id}
                    type="button"
                    onClick={() => handleSelectAsset(asset._id)}
                    style={{
                      padding: 0,
                      border: `2px solid ${isSelected ? "var(--card-focus-ring-color, #1e3a5f)" : "transparent"}`,
                      borderRadius: 6,
                      overflow: "hidden",
                      cursor: "pointer",
                      background: "var(--card-bg-color)",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    title={asset.originalFilename ?? asset._id}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.borderColor = "var(--card-focus-ring-color, #4a90d9)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = "transparent";
                    }}
                  >
                    {/* Thumbnail area */}
                    {isImage(asset) ? (
                      <div
                        style={{
                          aspectRatio: "1",
                          background: "var(--card-border-color)",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={
                            asset._type === "sanity.imageAsset"
                              ? builder
                                  .image(asset._id)
                                  .width(280)
                                  .height(280)
                                  .fit("crop")
                                  .auto("format")
                                  .url()
                              : `${asset.url}?w=280&h=280&fit=crop`
                          }
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          aspectRatio: "1",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          background: getFileType(asset.mimeType, asset.extension).bgColor,
                        }}
                      >
                        <FileTypeIcon mimeType={asset.mimeType} ext={asset.extension} size={56} />
                      </div>
                    )}
                    {/* Label */}
                    <div style={{ padding: "5px 6px" }}>
                      <div
                        style={{
                          fontSize: 11,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "var(--card-fg-color)",
                        }}
                      >
                        {asset.originalFilename ?? asset._id}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--card-muted-fg-color)" }}>
                        {formatFileSize(asset.size)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* ── List view (pdf, docs) ────────────────── */
            <Stack
              space={1}
              style={{ opacity: loading ? 0.5 : 1, transition: "opacity 150ms ease" }}
            >
              {assets.map((asset) => {
                const isSelected = asset._id === selectedId;
                const ft = getFileType(asset.mimeType, asset.extension);
                return (
                  <button
                    key={asset._id}
                    type="button"
                    onClick={() => handleSelectAsset(asset._id)}
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
                        width: 36,
                        height: 36,
                        borderRadius: 4,
                        overflow: "hidden",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: ft.bgColor,
                      }}
                    >
                      <FileTypeIcon mimeType={asset.mimeType} ext={asset.extension} size={28} />
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
                        {asset._createdAt &&
                          ` · ${new Date(asset._createdAt).toLocaleDateString("ja-JP")}`}
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
