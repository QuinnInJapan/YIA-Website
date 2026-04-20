"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { AddIcon, SearchIcon } from "@sanity/icons";
import createImageUrlBuilder from "@sanity/image-url";
import { fs } from "@/sanity/lib/studioTokens";

// ── Types ────────────────────────────────────────────────

export interface SanityImageAsset {
  _id: string;
  url: string;
  originalFilename: string | null;
  metadata: { dimensions?: { width: number; height: number } } | null;
}

// ── Constants ────────────────────────────────────────────

export const PICKER_PAGE = 30;

// ── PreviewImage ─────────────────────────────────────────

export function PreviewImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <div
      style={{
        width: "100%",
        height: 200,
        borderRadius: 4,
        overflow: "hidden",
        background: "var(--card-border-color)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!loaded && (
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
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        style={{
          maxWidth: "100%",
          maxHeight: 200,
          objectFit: "contain",
          display: "block",
          opacity: loaded ? 1 : 0,
          transition: "opacity 150ms ease",
        }}
      />
    </div>
  );
}

// ── ImagePickerPanel ─────────────────────────────────────

export function ImagePickerPanel({
  onSelect,
  onClose,
  mode = "single",
  onSelectMultiple,
  initialSelectedIds,
  galleryMode,
}: {
  onSelect?: (assetId: string) => void;
  onClose: () => void;
  mode?: "single" | "multi";
  onSelectMultiple?: (assetIds: string[]) => void;
  initialSelectedIds?: string[];
  galleryMode?: {
    selectedAssetIds: string[];
    onToggle: (assetId: string) => void;
  };
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(() => createImageUrlBuilder(client), [client]);

  const [assets, setAssets] = useState<SanityImageAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds ?? []);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch images
  useEffect(() => {
    setLoading(true);
    let filter = `_type == "sanity.imageAsset" && !(_id in path("drafts.**"))`;
    if (searchQuery.trim()) {
      const terms = searchQuery
        .trim()
        .split(/\s+/)
        .map((t) => `"${t}*"`)
        .join(", ");
      filter += ` && (originalFilename match [${terms}])`;
    }
    const start = page * PICKER_PAGE;
    const end = start + PICKER_PAGE;

    Promise.all([
      client.fetch<SanityImageAsset[]>(
        `*[${filter}] | order(_createdAt desc) [${start}...${end}] { _id, url, originalFilename, metadata { dimensions } }`,
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

  function toggleMultiSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleUpload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const asset = await client.assets.upload("image", file);
        if (galleryMode) {
          galleryMode.onToggle(asset._id);
        } else if (mode === "multi") {
          setSelectedIds((prev) => (prev.includes(asset._id) ? prev : [...prev, asset._id]));
        } else {
          onSelect?.(asset._id);
        }
      } catch (err) {
        console.error("Upload failed:", err);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  const totalPages = Math.ceil(total / PICKER_PAGE);

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
          {!galleryMode && (
            <Flex align="center" justify="space-between">
              <Text size={1} weight="semibold">
                {mode === "multi" ? "画像を選択（複数可）" : "画像を選択"}
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
          )}
          <Flex align="center" gap={2}>
            <div style={{ flex: 1 }}>
              <TextInput
                icon={SearchIcon}
                placeholder="ファイル名で検索…"
                value={search}
                onChange={(e) => handleSearchChange(e.currentTarget.value)}
                fontSize={0}
              />
            </div>
            {galleryMode && (
              <Button
                text="アップロード"
                icon={AddIcon}
                tone="primary"
                fontSize={0}
                padding={2}
                onClick={handleUpload}
                disabled={uploading}
              />
            )}
          </Flex>
          {uploading && (
            <Text size={0} muted>
              アップロード中…
            </Text>
          )}
        </Stack>
      </Box>

      {/* Grid */}
      <Box
        flex={1}
        style={{ overflow: "auto", position: "relative", display: "flex", flexDirection: "column" }}
      >
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

        {/* Multi-select confirm bar (hidden in gallery mode) */}
        {!galleryMode && mode === "multi" && selectedIds.length > 0 && (
          <div
            style={{
              borderBottom: "1px solid var(--card-border-color)",
              background: "var(--card-bg-color, #f7f9fb)",
              flexShrink: 0,
              padding: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text size={1} weight="semibold">
              {selectedIds.length}枚を選択中
            </Text>
            <Flex align="center" gap={2}>
              <Button
                text={`${selectedIds.length}枚を挿入`}
                tone="primary"
                fontSize={1}
                padding={3}
                onClick={() => {
                  onSelectMultiple?.(selectedIds);
                  setSelectedIds([]);
                }}
              />
              <Button
                text="✕"
                mode="bleed"
                fontSize={1}
                padding={3}
                onClick={() => setSelectedIds([])}
              />
            </Flex>
          </div>
        )}

        {/* Single-select confirm bar (hidden in gallery mode) */}
        {!galleryMode &&
          mode === "single" &&
          selectedId &&
          (() => {
            const selected = assets.find((a) => a._id === selectedId);
            if (!selected) return null;
            const dims = selected.metadata?.dimensions;
            return (
              <div
                style={{
                  borderBottom: "1px solid var(--card-border-color)",
                  background: "var(--card-bg-color, #f7f9fb)",
                  flexShrink: 0,
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <PreviewImage
                  src={builder.image(selected._id).width(600).auto("format").url()}
                  alt={selected.originalFilename ?? ""}
                />
                <Flex align="center" gap={3}>
                  <Stack space={1} style={{ flex: 1, minWidth: 0 }}>
                    <Text size={1} textOverflow="ellipsis">
                      {selected.originalFilename ?? selected._id}
                    </Text>
                    {dims && (
                      <Text size={0} muted>
                        {dims.width} × {dims.height}
                      </Text>
                    )}
                  </Stack>
                  <Flex align="center" gap={2} style={{ flexShrink: 0 }}>
                    <Button
                      text="挿入"
                      tone="primary"
                      fontSize={1}
                      padding={3}
                      onClick={() => {
                        onSelect?.(selectedId);
                        setSelectedId(null);
                      }}
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
            );
          })()}

        <Box flex={1} padding={3} style={{ overflow: "auto" }}>
          {!loading && assets.length === 0 ? (
            <Text size={1} muted>
              {searchQuery ? "検索結果がありません" : "画像がありません"}
            </Text>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                gap: 8,
                opacity: loading ? 0.5 : 1,
                transition: "opacity 150ms ease",
              }}
            >
              {assets.map((asset) => {
                const isInGallery = galleryMode?.selectedAssetIds.includes(asset._id);
                const isSelected = galleryMode
                  ? isInGallery
                  : mode === "multi"
                    ? selectedIds.includes(asset._id)
                    : asset._id === selectedId;
                return (
                  <button
                    key={asset._id}
                    type="button"
                    onClick={() =>
                      galleryMode
                        ? galleryMode.onToggle(asset._id)
                        : mode === "multi"
                          ? toggleMultiSelect(asset._id)
                          : setSelectedId(asset._id)
                    }
                    style={{
                      padding: 0,
                      border: `2px solid ${isSelected ? "var(--card-focus-ring-color, #1e3a5f)" : "transparent"}`,
                      borderRadius: 4,
                      overflow: "hidden",
                      cursor: "pointer",
                      background: "var(--card-border-color)",
                      aspectRatio: "1",
                      position: "relative",
                    }}
                    title={asset.originalFilename ?? asset._id}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "var(--card-focus-ring-color, #4a90d9)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                    }}
                  >
                    <img
                      src={builder
                        .image(asset._id)
                        .width(320)
                        .height(320)
                        .fit("crop")
                        .auto("format")
                        .url()}
                      alt={asset.originalFilename ?? ""}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    {/* Gallery mode: numbered badge for images in gallery */}
                    {galleryMode && isInGallery && (
                      <div
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          background: "var(--card-focus-ring-color, #1e3a5f)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: fs.label,
                          fontWeight: 700,
                          pointerEvents: "none",
                        }}
                      >
                        {galleryMode.selectedAssetIds.indexOf(asset._id) + 1}
                      </div>
                    )}
                    {/* Multi-select mode: numbered badge */}
                    {!galleryMode && mode === "multi" && isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          background: "var(--card-focus-ring-color, #1e3a5f)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: fs.label,
                          fontWeight: 700,
                          pointerEvents: "none",
                        }}
                      >
                        {selectedIds.indexOf(asset._id) + 1}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Box>
      </Box>

      {/* Pagination + close */}
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
