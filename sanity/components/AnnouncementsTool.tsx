"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { AddIcon, SearchIcon } from "@sanity/icons";
import { Pagination } from "./shared/ui";
import { ImagePickerPanel } from "./shared/ImagePickerPanel";
import { CombinedGalleryPanel, type GalleryImageItem } from "./blog/GalleryPanel";
import { PreviewPanel } from "./shared/PreviewPanel";
import { RightPanel } from "./shared/RightPanel";
import { FilePickerPanel } from "./shared/FilePickerPanel";
import { HotspotCropTool } from "./shared/HotspotCropTool";
import {
  DocumentDetailPanel,
  type DocumentLinkItem as SharedDocumentLinkItem,
} from "./shared/DocumentDetailPanel";
import { AnnouncementEditor, type AnnouncementDoc } from "./announcements/AnnouncementEditor";
import { AnnouncementPreview } from "./announcements/AnnouncementPreview";
import { useDeepLink } from "./shared/useDeepLink";

// ── Types ────────────────────────────────────────────────

interface AnnouncementItem {
  _id: string;
  titleJa: string | null;
  titleEn: string | null;
  date: string | null;
  pinned: boolean | null;
  slug: string | null;
  hasDraft: boolean;
}

// ── Constants ────────────────────────────────────────────

const PAGE_SIZE = 20;

type FilterMode = "all" | "pinned" | "upcoming" | "past";

// ── Helpers ──────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "下書き";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("ja-JP");
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── GROQ ─────────────────────────────────────────────────

const LIST_PROJECTION = `{
  _id,
  "titleJa": title[_key == "ja"][0].value,
  "titleEn": title[_key == "en"][0].value,
  date,
  pinned,
  "slug": slug.current,
  "hasDraft": defined(*[_id == "drafts." + ^._id][0])
}`;

function buildFilter(search: string, filterMode: FilterMode): string {
  let filter = `_type == "announcement" && !(_id in path("drafts.**"))`;
  if (search.trim()) {
    const terms = search
      .trim()
      .split(/\s+/)
      .map((t) => `"${t}*"`)
      .join(", ");
    filter += ` && (title[_key == "ja"][0].value match [${terms}] || title[_key == "en"][0].value match [${terms}])`;
  }
  switch (filterMode) {
    case "pinned":
      filter += ` && pinned == true`;
      break;
    case "upcoming":
      filter += ` && date >= "${todayStr()}"`;
      break;
    case "past":
      filter += ` && date < "${todayStr()}"`;
      break;
  }
  return filter;
}

// ── Sidebar row ──────────────────────────────────────────

function SidebarRow({
  item,
  isSelected,
  onSelect,
}: {
  item: AnnouncementItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        textAlign: "left",
        padding: "8px 10px",
        border: "none",
        borderRadius: 4,
        background: isSelected ? "var(--card-border-color)" : "transparent",
        cursor: "pointer",
        color: "var(--card-fg-color)",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: isSelected ? 600 : 400,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.pinned && "📌 "}
          {item.titleJa ?? "（タイトルなし）"}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--card-muted-fg-color)",
            marginTop: 2,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {item.hasDraft && (
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#e6a317",
                flexShrink: 0,
              }}
            />
          )}
          {formatDate(item.date)}
        </div>
      </div>
    </button>
  );
}

// ── Main component ───────────────────────────────────────

export function AnnouncementsTool() {
  const client = useClient({ apiVersion: "2024-01-01" });

  // List state
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // Selection → opens editor
  const deepLinkId = useDeepLink("announcements");
  const [editingId, setEditingId] = useState<string | null>(deepLinkId);

  // Preview state
  const [mergedDoc, setMergedDoc] = useState<AnnouncementDoc | null>(null);

  // Right panel state
  const [rightPanel, setRightPanel] = useState<
    | { type: "imagePicker"; onSelect: (assetId: string) => void }
    | {
        type: "galleryEditor";
        blockKey: string;
        initialImages: GalleryImageItem[];
        onUpdateImages: (images: GalleryImageItem[]) => void;
      }
    | { type: "filePicker"; onSelect: (assetId: string, filename: string, ext: string) => void }
    | {
        type: "hotspotCrop";
        imageUrl: string;
        value: { hotspot: any; crop: any };
        onChange: (v: { hotspot: any; crop: any }) => void;
      }
    | {
        type: "documentDetail";
        doc: SharedDocumentLinkItem;
        onUpdate: (doc: SharedDocumentLinkItem) => void;
        onRemove: () => void;
      }
    | null
  >(null);

  const handleOpenImagePicker = useCallback((onSelect: (assetId: string) => void) => {
    setRightPanel({ type: "imagePicker", onSelect });
  }, []);

  const handleOpenFilePicker = useCallback(
    (onSelect: (assetId: string, filename: string, ext: string) => void) => {
      setRightPanel({ type: "filePicker", onSelect });
    },
    [],
  );

  const handleShowHotspotCrop = useCallback(
    (
      imageUrl: string,
      value: { hotspot: any; crop: any },
      onChange: (v: { hotspot: any; crop: any }) => void,
    ) => {
      setRightPanel({ type: "hotspotCrop", imageUrl, value, onChange });
    },
    [],
  );

  const handleOpenDocumentDetail = useCallback(
    (
      doc: SharedDocumentLinkItem,
      onUpdate: (doc: SharedDocumentLinkItem) => void,
      onRemove: () => void,
    ) => {
      setRightPanel({ type: "documentDetail", doc, onUpdate, onRemove });
    },
    [],
  );

  const handleOpenGalleryEditor = useCallback(
    (
      blockKey: string,
      images: GalleryImageItem[],
      onUpdate: (images: GalleryImageItem[]) => void,
    ) => {
      setRightPanel({
        type: "galleryEditor",
        blockKey,
        initialImages: images,
        onUpdateImages: onUpdate,
      });
    },
    [],
  );

  // ── Fetch items ────────────────────────────────────────

  const fetchItems = useCallback(
    (currentPage: number, search: string, filter: FilterMode) => {
      setLoading(true);
      const f = buildFilter(search, filter);
      const start = currentPage * PAGE_SIZE;
      const end = start + PAGE_SIZE;

      Promise.all([
        client.fetch<AnnouncementItem[]>(
          `*[${f}] | order(pinned desc, date desc) [${start}...${end}] ${LIST_PROJECTION}`,
        ),
        client.fetch<number>(`count(*[${f}])`),
      ])
        .then(([results, count]) => {
          setItems(results);
          setTotalCount(count);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    },
    [client],
  );

  useEffect(() => {
    fetchItems(page, searchQuery, filterMode);
  }, [fetchItems, page, searchQuery, filterMode]);

  // Real-time listener
  useEffect(() => {
    const subscription = client
      .listen('*[_type == "announcement"]')
      .subscribe(() => fetchItems(page, searchQuery, filterMode));
    return () => subscription.unsubscribe();
  }, [client, fetchItems, page, searchQuery, filterMode]);

  // ── Handlers ───────────────────────────────────────────

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      setSearchQuery(value);
    }, 300);
  }

  function handleFilterChange(mode: FilterMode) {
    setFilterMode(mode);
    setPage(0);
  }

  async function handleCreate() {
    try {
      const id = crypto.randomUUID().replace(/-/g, "").slice(0, 22);
      await client.create({
        _id: `drafts.${id}`,
        _type: "announcement",
        title: [
          { _key: "ja", value: "新しいお知らせ" },
          { _key: "en", value: "" },
        ],
        date: todayStr(),
        pinned: false,
      });
      setEditingId(id);
    } catch (err) {
      console.error("Create failed:", err);
    }
  }

  // ── Render ─────────────────────────────────────────────

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const FILTERS: { mode: FilterMode; label: string }[] = [
    { mode: "all", label: "すべて" },
    { mode: "pinned", label: "固定" },
    { mode: "upcoming", label: "今後" },
    { mode: "past", label: "過去" },
  ];

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* ── Left: List sidebar ── */}
      <div
        style={{
          width: 340,
          flexShrink: 0,
          borderRight: "1px solid var(--card-border-color)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Sidebar header */}
        <Box padding={3} style={{ borderBottom: "1px solid var(--card-border-color)" }}>
          <Stack space={3}>
            <Flex align="center" justify="space-between">
              <Text size={1} weight="semibold">
                お知らせ
              </Text>
              <Button
                icon={AddIcon}
                mode="bleed"
                tone="primary"
                fontSize={0}
                padding={2}
                onClick={handleCreate}
              />
            </Flex>
            <TextInput
              icon={SearchIcon}
              placeholder="検索…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.currentTarget.value)}
              fontSize={0}
            />
            <Flex gap={1} wrap="wrap">
              {FILTERS.map((f) => (
                <Button
                  key={f.mode}
                  text={f.label}
                  mode={filterMode === f.mode ? "default" : "ghost"}
                  tone={filterMode === f.mode ? "primary" : "default"}
                  fontSize={0}
                  padding={1}
                  onClick={() => handleFilterChange(f.mode)}
                />
              ))}
            </Flex>
          </Stack>
        </Box>

        {/* List */}
        <div style={{ flex: 1, overflow: "auto", padding: 8, position: "relative" }}>
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
          <style>{`@keyframes sidebarLoad { 0% { transform: scaleX(0); } 50% { transform: scaleX(0.7); } 100% { transform: scaleX(1); opacity: 0; } }`}</style>
          <div
            style={{
              opacity: loading && items.length > 0 ? 0.5 : 1,
              pointerEvents: loading && items.length > 0 ? "none" : "auto",
              transition: "opacity 150ms ease",
            }}
          >
            {!loading && items.length === 0 ? (
              <Box padding={3}>
                {searchQuery || filterMode !== "all" ? (
                  <Text size={0} muted>
                    検索結果がありません
                  </Text>
                ) : (
                  <Flex direction="column" align="center" gap={3} paddingY={4}>
                    <Text size={0} muted>
                      お知らせがありません
                    </Text>
                    <Button
                      icon={AddIcon}
                      text="最初のお知らせを作成"
                      tone="primary"
                      fontSize={0}
                      padding={2}
                      onClick={handleCreate}
                    />
                  </Flex>
                )}
              </Box>
            ) : (
              <Stack space={1}>
                {items.map((item) => (
                  <SidebarRow
                    key={item._id}
                    item={item}
                    isSelected={item._id === editingId}
                    onSelect={() => {
                      setEditingId(item._id);
                      setRightPanel(null);
                    }}
                  />
                ))}
              </Stack>
            )}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        </div>
      </div>

      {/* ── Center: Editor ── */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        {editingId ? (
          <AnnouncementEditor
            key={editingId}
            documentId={editingId.replace(/^drafts\./, "")}
            onOpenImagePicker={handleOpenImagePicker}
            onOpenGalleryEditor={handleOpenGalleryEditor}
            activeGalleryBlockKey={
              rightPanel?.type === "galleryEditor" ? rightPanel.blockKey : null
            }
            onDeselectGallery={() => setRightPanel(null)}
            onDelete={() => {
              setEditingId(null);
              setRightPanel(null);
              setMergedDoc(null);
              fetchItems(page, searchQuery, filterMode);
            }}
            onMergedChange={setMergedDoc}
            onDraftChange={() => fetchItems(page, searchQuery, filterMode)}
            onOpenFilePicker={handleOpenFilePicker}
            onShowHotspotCrop={handleShowHotspotCrop}
            onOpenDocumentDetail={handleOpenDocumentDetail}
          />
        ) : (
          <Flex
            align="center"
            justify="center"
            direction="column"
            gap={4}
            style={{ height: "100%", color: "var(--card-muted-fg-color)" }}
          >
            <Text size={3} muted>
              お知らせを選択してください
            </Text>
            <Button
              icon={AddIcon}
              text="新しいお知らせを作成"
              tone="primary"
              mode="ghost"
              fontSize={1}
              padding={3}
              onClick={handleCreate}
            />
          </Flex>
        )}
      </div>

      {/* ── Right: Image picker / Gallery / Preview ── */}
      {rightPanel ? (
        <RightPanel>
          {rightPanel.type === "imagePicker" ? (
            <ImagePickerPanel onSelect={rightPanel.onSelect} onClose={() => setRightPanel(null)} />
          ) : rightPanel.type === "filePicker" ? (
            <FilePickerPanel onSelect={rightPanel.onSelect} onClose={() => setRightPanel(null)} />
          ) : rightPanel.type === "galleryEditor" ? (
            <CombinedGalleryPanel
              key={rightPanel.blockKey}
              initialImages={rightPanel.initialImages}
              onUpdateImages={rightPanel.onUpdateImages}
              onClose={() => setRightPanel(null)}
            />
          ) : rightPanel.type === "hotspotCrop" ? (
            <HotspotCropTool
              imageUrl={rightPanel.imageUrl}
              value={rightPanel.value}
              onChange={rightPanel.onChange}
              onClose={() => setRightPanel(null)}
            />
          ) : rightPanel.type === "documentDetail" ? (
            <DocumentDetailPanel
              doc={rightPanel.doc}
              onUpdate={(updated) => {
                rightPanel.onUpdate(updated);
                setRightPanel((prev) =>
                  prev?.type === "documentDetail" ? { ...prev, doc: updated } : prev,
                );
              }}
              onRemove={() => {
                rightPanel.onRemove();
                setRightPanel(null);
              }}
              onChangeFile={() => {
                const { doc, onUpdate } = rightPanel;
                setRightPanel({
                  type: "filePicker",
                  onSelect: (assetId, filename, ext) => {
                    const updated: SharedDocumentLinkItem = {
                      ...doc,
                      file: { asset: { _ref: assetId } },
                      fileType: ext,
                    };
                    onUpdate(updated);
                    setRightPanel({
                      type: "documentDetail",
                      doc: updated,
                      onUpdate,
                      onRemove: rightPanel.onRemove,
                    });
                  },
                });
              }}
              onClose={() => setRightPanel(null)}
            />
          ) : null}
        </RightPanel>
      ) : mergedDoc ? (
        <RightPanel>
          <PreviewPanel>
            <AnnouncementPreview doc={mergedDoc} />
          </PreviewPanel>
        </RightPanel>
      ) : null}
    </div>
  );
}
