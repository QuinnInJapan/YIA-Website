"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useClient } from "sanity";
import { useRouter } from "sanity/router";
import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Inline,
  Label,
  Stack,
  Text,
  TextInput,
} from "@sanity/ui";
import { SearchIcon, TrashIcon, UploadIcon, CloseIcon, DownloadIcon } from "@sanity/icons";

// ── Types ────────────────────────────────────────────────

interface SanityAsset {
  _id: string;
  _type: string;
  _createdAt: string;
  originalFilename: string | null;
  url: string;
  mimeType: string | null;
  size: number | null;
  metadata?: { dimensions?: { width: number; height: number } };
  refCount: number;
}

interface ReferencingDoc {
  _id: string;
  _type: string;
  title?: string;
}

const PAGE_SIZE = 24;

// ── File type visuals ────────────────────────────────────

interface FileTypeInfo {
  label: string;
  color: string;
  bgColor: string;
}

function getFileType(mimeType: string | null): FileTypeInfo {
  if (!mimeType) return { label: "FILE", color: "#6b7a8d", bgColor: "#f0f2f5" };

  if (mimeType === "application/pdf") return { label: "PDF", color: "#d93025", bgColor: "#fce8e6" };

  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return { label: "Excel", color: "#188038", bgColor: "#e6f4ea" };

  if (mimeType === "text/csv") return { label: "CSV", color: "#188038", bgColor: "#e6f4ea" };

  if (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return { label: "Word", color: "#1a73e8", bgColor: "#e8f0fe" };

  return {
    label: mimeType.split("/")[1]?.toUpperCase() ?? "FILE",
    color: "#6b7a8d",
    bgColor: "#f0f2f5",
  };
}

function FileTypeIcon({ mimeType, size = 32 }: { mimeType: string | null; size?: number }) {
  const ft = getFileType(mimeType);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 4 H26 L32 10 V36 H8 Z" fill="white" stroke={ft.color} strokeWidth="1.5" />
      <path d="M26 4 V10 H32" fill={ft.bgColor} stroke={ft.color} strokeWidth="1.5" />
      <rect x="10" y="19" width="20" height="12" rx="2" fill={ft.color} />
      <text
        x="20"
        y="28"
        textAnchor="middle"
        fill="white"
        fontSize={ft.label.length > 4 ? "6" : "7.5"}
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {ft.label}
      </text>
    </svg>
  );
}

function FileTile({ asset }: { asset: SanityAsset }) {
  const ft = getFileType(asset.mimeType);

  return (
    <div
      style={{
        aspectRatio: "1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: ft.bgColor,
      }}
    >
      <FileTypeIcon mimeType={asset.mimeType} size={96} />
    </div>
  );
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── View mode icons ──────────────────────────────────────

function IconViewIcon({ active }: { active: boolean }) {
  const color = active ? "var(--card-link-color)" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={color}>
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

function ListViewIcon({ active }: { active: boolean }) {
  const color = active ? "var(--card-link-color)" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={color}>
      <rect x="1" y="1" width="4" height="3" rx="0.5" />
      <rect x="7" y="1.5" width="8" height="2" rx="0.5" />
      <rect x="1" y="6.5" width="4" height="3" rx="0.5" />
      <rect x="7" y="7" width="8" height="2" rx="0.5" />
      <rect x="1" y="12" width="4" height="3" rx="0.5" />
      <rect x="7" y="12.5" width="8" height="2" rx="0.5" />
    </svg>
  );
}

// ── Type filter ──────────────────────────────────────────

type TypeFilter = "images" | "pdf" | "excel" | "word" | "all";
type ViewMode = "icon" | "list";

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "images", label: "画像" },
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel" },
  { value: "word", label: "Word" },
  { value: "all", label: "すべて" },
];

function typeFilterGroq(filter: TypeFilter): string {
  switch (filter) {
    case "images":
      return `_type == "sanity.imageAsset"`;
    case "pdf":
      return `mimeType == "application/pdf"`;
    case "excel":
      return `mimeType in ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"]`;
    case "word":
      return `mimeType in ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]`;
    case "all":
      return `_type in ["sanity.imageAsset", "sanity.fileAsset"]`;
  }
}

// ── GROQ helpers ─────────────────────────────────────────

function buildFilter(search: string, typeFilter: TypeFilter): string {
  const base = `${typeFilterGroq(typeFilter)} && !(_id in path("drafts.**"))`;
  if (!search.trim()) return base;
  const terms = search
    .trim()
    .split(/\s+/)
    .map((t) => `"${t}*"`)
    .join(", ");
  return `${base} && (originalFilename match [${terms}] || title match [${terms}] || altText match [${terms}] || description match [${terms}])`;
}

const PROJECTION = `{
  _id, _type, _createdAt, originalFilename, url, mimeType, size,
  metadata { dimensions },
  "refCount": count(*[references(^._id)])
}`;

// ── Detail panel ─────────────────────────────────────────

function DetailPanel({
  asset,
  references,
  refsLoading,
  confirmingDelete,
  deleting,
  onClose,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  router,
}: {
  asset: SanityAsset;
  references: ReferencingDoc[];
  refsLoading: boolean;
  confirmingDelete: boolean;
  deleting: boolean;
  onClose: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const isImg = asset.mimeType?.startsWith("image/");

  return (
    <Card
      border
      radius={2}
      padding={4}
      style={{ width: 320, flexShrink: 0, alignSelf: "flex-start" }}
    >
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Heading as="h3" size={0}>
            詳細
          </Heading>
          <Button icon={CloseIcon} mode="bleed" fontSize={1} padding={2} onClick={onClose} />
        </Flex>

        {/* Preview */}
        {isImg ? (
          <img
            src={`${asset.url}?w=600&auto=format`}
            alt={asset.originalFilename ?? ""}
            style={{
              width: "100%",
              borderRadius: 4,
              border: "1px solid var(--card-border-color)",
            }}
          />
        ) : asset.mimeType === "application/pdf" ? (
          <iframe
            src={asset.url}
            title={asset.originalFilename ?? "PDF"}
            style={{
              width: "100%",
              height: 400,
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
              padding: "24px 16px",
              borderRadius: 4,
              background: getFileType(asset.mimeType).bgColor,
              border: `1px solid ${getFileType(asset.mimeType).color}20`,
            }}
          >
            <FileTypeIcon mimeType={asset.mimeType} size={80} />
          </div>
        )}

        {/* Metadata */}
        <Stack space={3}>
          <Stack space={1}>
            <Label size={0}>ファイル名</Label>
            <Text size={1}>{asset.originalFilename ?? "—"}</Text>
          </Stack>
          <Stack space={1}>
            <Label size={0}>サイズ</Label>
            <Text size={1}>{formatBytes(asset.size)}</Text>
          </Stack>
          {asset.metadata?.dimensions && (
            <Stack space={1}>
              <Label size={0}>サイズ（ピクセル）</Label>
              <Text size={1}>
                {asset.metadata.dimensions.width} x {asset.metadata.dimensions.height}
              </Text>
            </Stack>
          )}
          <Stack space={1}>
            <Label size={0}>種類</Label>
            <Text size={1}>{asset.mimeType ?? "—"}</Text>
          </Stack>
          <Stack space={1}>
            <Label size={0}>アップロード日</Label>
            <Text size={1}>{new Date(asset._createdAt).toLocaleDateString("ja-JP")}</Text>
          </Stack>
        </Stack>

        {/* References */}
        <Stack space={2}>
          <Label size={0}>参照ドキュメント</Label>
          {refsLoading ? (
            <Text size={1} muted>
              確認中…
            </Text>
          ) : references.length === 0 ? (
            <Text size={1} muted>
              参照なし
            </Text>
          ) : (
            <Stack space={2}>
              {references.map((ref) => (
                <Card
                  key={ref._id}
                  padding={2}
                  radius={2}
                  border
                  style={{ cursor: "pointer" }}
                  onClick={() => router.navigateIntent("edit", { id: ref._id })}
                >
                  <Flex align="center" gap={2}>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--card-link-color)",
                        flexShrink: 0,
                      }}
                    />
                    <Stack space={1} style={{ minWidth: 0 }}>
                      <Text size={1} weight="medium" textOverflow="ellipsis">
                        {ref.title ?? ref._type}
                      </Text>
                      <Text size={0} muted>
                        {ref._type}
                      </Text>
                    </Stack>
                  </Flex>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>

        {/* Actions */}
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
        </Flex>

        {/* Delete */}
        {!refsLoading && (
          <>
            {references.length > 0 ? (
              <Card padding={3} radius={2} tone="caution" border>
                <Text size={1}>使用中のため削除できません（{references.length}件の参照）</Text>
              </Card>
            ) : confirmingDelete ? (
              <Flex gap={2}>
                <Button
                  icon={TrashIcon}
                  text="削除する"
                  tone="critical"
                  fontSize={1}
                  padding={2}
                  onClick={onDelete}
                  disabled={deleting}
                />
                <Button
                  text="キャンセル"
                  mode="ghost"
                  fontSize={1}
                  padding={2}
                  onClick={onCancelDelete}
                />
              </Flex>
            ) : (
              <Button
                icon={TrashIcon}
                text="削除"
                mode="ghost"
                tone="critical"
                fontSize={1}
                padding={2}
                onClick={onConfirmDelete}
              />
            )}
          </>
        )}
      </Stack>
    </Card>
  );
}

// ── Pagination ───────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <Flex align="center" justify="center" gap={3}>
      <Button
        text="前へ"
        mode="ghost"
        fontSize={1}
        padding={2}
        onClick={onPrev}
        disabled={page === 0}
      />
      <Text size={1} muted>
        {page + 1} / {totalPages}
      </Text>
      <Button
        text="次へ"
        mode="ghost"
        fontSize={1}
        padding={2}
        onClick={onNext}
        disabled={page >= totalPages - 1}
      />
    </Flex>
  );
}

// ── List view row ────────────────────────────────────────

function ListRow({
  asset,
  isSelected,
  onSelect,
}: {
  asset: SanityAsset;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isImg = asset.mimeType?.startsWith("image/");

  return (
    <Card
      radius={2}
      border
      tone={isSelected ? "primary" : undefined}
      onClick={onSelect}
      style={{ cursor: "pointer" }}
      padding={2}
    >
      <Flex align="center" gap={3}>
        {/* Icon / tiny thumbnail */}
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
            background: isImg ? "var(--card-border-color)" : getFileType(asset.mimeType).bgColor,
          }}
        >
          {isImg ? (
            <img
              src={`${asset.url}?w=72&h=72&fit=crop&auto=format`}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <FileTypeIcon mimeType={asset.mimeType} size={24} />
          )}
        </div>

        {/* Filename */}
        <Box flex={1} style={{ minWidth: 0 }}>
          <Text size={1} textOverflow="ellipsis">
            {asset.originalFilename ?? "—"}
          </Text>
        </Box>

        {/* Size */}
        <Text size={0} muted style={{ flexShrink: 0, width: 70, textAlign: "right" }}>
          {formatBytes(asset.size)}
        </Text>

        {/* Date */}
        <Text size={0} muted style={{ flexShrink: 0, width: 90, textAlign: "right" }}>
          {new Date(asset._createdAt).toLocaleDateString("ja-JP")}
        </Text>
      </Flex>
    </Card>
  );
}

// ── Main component ───────────────────────────────────────

export function MediaBrowser() {
  const client = useClient({ apiVersion: "2024-01-01" });
  const router = useRouter();

  // Grid state
  const [assets, setAssets] = useState<SanityAsset[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter + view
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("images");
  const [viewMode, setViewMode] = useState<ViewMode>("icon");

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detail panel
  const [selected, setSelected] = useState<SanityAsset | null>(null);
  const [references, setReferences] = useState<ReferencingDoc[]>([]);
  const [refsLoading, setRefsLoading] = useState(false);

  // Delete
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // ── Fetch assets ──────────────────────────────────────

  const fetchAssets = useCallback(
    (currentPage: number, search: string, type: TypeFilter) => {
      setLoading(true);
      const filter = buildFilter(search, type);
      const start = currentPage * PAGE_SIZE;
      const end = start + PAGE_SIZE;

      Promise.all([
        client.fetch<SanityAsset[]>(
          `*[${filter}] | order(_createdAt desc) [${start}...${end}] ${PROJECTION}`,
        ),
        client.fetch<number>(`count(*[${filter}])`),
      ])
        .then(([items, count]) => {
          setAssets(items);
          setTotalCount(count);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    },
    [client],
  );

  useEffect(() => {
    fetchAssets(page, searchQuery, typeFilter);
  }, [fetchAssets, page, searchQuery, typeFilter]);

  // ── Search debounce ───────────────────────────────────

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      setSearchQuery(value);
    }, 300);
  }

  // ── Select asset ──────────────────────────────────────

  function handleSelect(asset: SanityAsset) {
    setSelected(asset);
    setConfirmingDelete(false);
    setRefsLoading(true);
    client
      .fetch<ReferencingDoc[]>(
        `*[references($id)] { _id, _type, "title": coalesce(title[_key == "ja"][0].value, title, name) }`,
        { id: asset._id },
      )
      .then(setReferences)
      .catch(console.error)
      .finally(() => setRefsLoading(false));
  }

  function closeDetail() {
    setSelected(null);
    setReferences([]);
    setConfirmingDelete(false);
  }

  // ── Delete ────────────────────────────────────────────

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await client.delete(selected._id);
      closeDetail();
      fetchAssets(page, searchQuery, typeFilter);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  // ── Upload ────────────────────────────────────────────

  async function handleUpload(files: FileList) {
    setUploading(true);
    const total = files.length;
    let completed = 0;

    for (const file of Array.from(files)) {
      setUploadProgress(`アップロード中… ${completed + 1}/${total}`);
      const type = file.type.startsWith("image/") ? "image" : "file";
      try {
        await client.assets.upload(type, file, { filename: file.name });
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
      }
      completed++;
    }

    setUploading(false);
    setUploadProgress("");
    setPage(0);
    setSearchQuery("");
    setSearchInput("");
    fetchAssets(0, "", typeFilter);
  }

  // ── Derived ───────────────────────────────────────────

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const isImage = (a: SanityAsset) => a.mimeType?.startsWith("image/");

  // ── Render ────────────────────────────────────────────

  return (
    <Box padding={4} sizing="border" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <Stack space={4}>
        {/* Header */}
        <Flex align="center" justify="space-between" gap={3}>
          <Heading as="h1" size={2}>
            メディア
          </Heading>
          <Inline space={2}>
            {uploading && (
              <Text size={1} muted>
                {uploadProgress}
              </Text>
            )}
            <Button
              icon={UploadIcon}
              text="アップロード"
              tone="primary"
              fontSize={1}
              padding={3}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleUpload(e.target.files);
                  e.target.value = "";
                }
              }}
            />
          </Inline>
        </Flex>

        {/* Search + type filter + view toggle */}
        <Flex gap={3} align="center" wrap="wrap">
          <Box flex={1} style={{ minWidth: 200 }}>
            <TextInput
              icon={SearchIcon}
              placeholder="ファイル名で検索…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.currentTarget.value)}
              fontSize={1}
            />
          </Box>
          <Inline space={1}>
            {TYPE_FILTERS.map((f) => (
              <Button
                key={f.value}
                text={f.label}
                mode={typeFilter === f.value ? "default" : "ghost"}
                tone={typeFilter === f.value ? "primary" : "default"}
                fontSize={1}
                padding={2}
                onClick={() => {
                  setTypeFilter(f.value);
                  setPage(0);
                  closeDetail();
                }}
              />
            ))}
          </Inline>
          {/* View mode toggle */}
          <Inline space={1}>
            <button
              type="button"
              title="アイコン表示"
              onClick={() => setViewMode("icon")}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "6px 8px",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                background: viewMode === "icon" ? "var(--card-border-color)" : "transparent",
              }}
            >
              <IconViewIcon active={viewMode === "icon"} />
            </button>
            <button
              type="button"
              title="リスト表示"
              onClick={() => setViewMode("list")}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "6px 8px",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                background: viewMode === "list" ? "var(--card-border-color)" : "transparent",
              }}
            >
              <ListViewIcon active={viewMode === "list"} />
            </button>
          </Inline>
        </Flex>

        {/* Main layout */}
        <Flex gap={4} style={{ minHeight: 400 }}>
          {/* Asset list/grid */}
          <Box flex={1}>
            {loading && assets.length === 0 ? (
              <Card padding={5} radius={2}>
                <Text muted>読み込み中…</Text>
              </Card>
            ) : !loading && assets.length === 0 ? (
              <Card padding={5} radius={2} border>
                <Text muted>{searchQuery ? "検索結果がありません" : "メディアがありません"}</Text>
              </Card>
            ) : (
              <div
                style={{
                  opacity: loading ? 0.5 : 1,
                  pointerEvents: loading ? "none" : "auto",
                  transition: "opacity 150ms ease",
                }}
              >
                <Stack space={4}>
                  {viewMode === "icon" ? (
                    /* ── Icon view ─────────────────────────── */
                    <Grid columns={[2, 3, 4, 6]} gap={3}>
                      {assets.map((asset) => (
                        <Card
                          key={asset._id}
                          radius={2}
                          border
                          tone={selected?._id === asset._id ? "primary" : undefined}
                          onClick={() => handleSelect(asset)}
                          style={{ cursor: "pointer", overflow: "hidden" }}
                        >
                          {isImage(asset) ? (
                            <div
                              style={{
                                aspectRatio: "1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "var(--card-border-color)",
                                overflow: "hidden",
                              }}
                            >
                              <img
                                src={`${asset.url}?w=200&h=200&fit=crop&auto=format`}
                                alt={asset.originalFilename ?? ""}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          ) : (
                            <FileTile asset={asset} />
                          )}
                          <Box padding={2}>
                            <Stack space={1}>
                              <Text size={0} textOverflow="ellipsis" style={{ minWidth: 0 }}>
                                {asset.originalFilename ?? "—"}
                              </Text>
                              <Text size={0} muted>
                                {formatBytes(asset.size)}
                              </Text>
                            </Stack>
                          </Box>
                        </Card>
                      ))}
                    </Grid>
                  ) : (
                    /* ── List view ─────────────────────────── */
                    <Stack space={1}>
                      {/* Column headers */}
                      <Box paddingX={2} paddingY={1}>
                        <Flex align="center" gap={3}>
                          <div style={{ width: 36, flexShrink: 0 }} />
                          <Box flex={1}>
                            <Text size={0} weight="medium" muted>
                              ファイル名
                            </Text>
                          </Box>
                          <Text
                            size={0}
                            weight="medium"
                            muted
                            style={{ width: 70, textAlign: "right", flexShrink: 0 }}
                          >
                            サイズ
                          </Text>
                          <Text
                            size={0}
                            weight="medium"
                            muted
                            style={{ width: 90, textAlign: "right", flexShrink: 0 }}
                          >
                            日付
                          </Text>
                        </Flex>
                      </Box>
                      {assets.map((asset) => (
                        <ListRow
                          key={asset._id}
                          asset={asset}
                          isSelected={selected?._id === asset._id}
                          onSelect={() => handleSelect(asset)}
                        />
                      ))}
                    </Stack>
                  )}

                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPrev={() => setPage((p) => p - 1)}
                    onNext={() => setPage((p) => p + 1)}
                  />
                </Stack>
              </div>
            )}
          </Box>

          {/* Detail panel */}
          {selected && (
            <DetailPanel
              asset={selected}
              references={references}
              refsLoading={refsLoading}
              confirmingDelete={confirmingDelete}
              deleting={deleting}
              onClose={closeDetail}
              onDelete={handleDelete}
              onConfirmDelete={() => setConfirmingDelete(true)}
              onCancelDelete={() => setConfirmingDelete(false)}
              router={router}
            />
          )}
        </Flex>
      </Stack>
    </Box>
  );
}
