"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { AddIcon, SearchIcon } from "@sanity/icons";
import createImageUrlBuilder from "@sanity/image-url";
import { Pagination } from "./shared/ui";
import { ImagePickerPanel } from "./shared/ImagePickerPanel";
import { PreviewPanel } from "./shared/PreviewPanel";
import { RightPanel } from "./shared/RightPanel";
import { FilePickerPanel } from "./shared/FilePickerPanel";
import { HotspotCropTool } from "./shared/HotspotCropTool";
import {
  DocumentDetailPanel,
  type DocumentLinkItem as SharedDocumentLinkItem,
} from "./shared/DocumentDetailPanel";
import { PostEditor, type BlogPostDoc } from "./blog/PostEditor";
import { BlogPostPreview } from "./blog/BlogPostPreview";
import { CombinedGalleryPanel, type GalleryImageItem } from "./blog/GalleryPanel";
import { useDeepLink } from "./shared/useDeepLink";

// ── Types ────────────────────────────────────────────────

interface BlogPostItem {
  _id: string;
  titleJa: string | null;
  titleEn: string | null;
  publishedAt: string | null;
  categoryJa: string | null;
  slug: string | null;
  heroImage: { asset?: { _ref: string } } | null;
  hasDraft: boolean;
  isDraftOnly: boolean;
}

// ── Constants ────────────────────────────────────────────

const PAGE_SIZE = 20;

// ── Helpers ──────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "下書き";
  return new Date(dateStr).toLocaleDateString("ja-JP");
}

// ── GROQ ─────────────────────────────────────────────────

const LIST_PROJECTION = `{
  "_id": select(
    _id in path("drafts.**") => string::split(_id, "drafts.")[1],
    _id
  ),
  "titleJa": title[_key == "ja"][0].value,
  "titleEn": title[_key == "en"][0].value,
  publishedAt,
  "categoryJa": category[_key == "ja"][0].value,
  "slug": slug.current,
  heroImage,
  "isDraftOnly": _id in path("drafts.**") && !defined(*[_id == string::split(^._id, "drafts.")[1]][0]),
  "hasDraft": select(
    _id in path("drafts.**") => true,
    defined(*[_id == "drafts." + ^._id][0])
  )
}`;

function buildFilter(search: string, category: string): string {
  // Include published docs + draft-only docs (no published version).
  // Exclude drafts that also have a published version (to avoid duplicates).
  let filter = `_type == "blogPost" && !(_id in path("drafts.**") && defined(*[_id == string::split(^._id, "drafts.")[1]][0]))`;
  if (search.trim()) {
    const terms = search
      .trim()
      .split(/\s+/)
      .map((t) => `"${t}*"`)
      .join(", ");
    filter += ` && (title[_key == "ja"][0].value match [${terms}] || title[_key == "en"][0].value match [${terms}])`;
  }
  if (category) {
    filter += ` && category[_key == "ja"][0].value == "${category}"`;
  }
  return filter;
}

// ── Sidebar row (compact) ─────────────────────────────

function SidebarRow({
  post,
  isSelected,
  onSelect,
  thumbnailUrl,
}: {
  post: BlogPostItem;
  isSelected: boolean;
  onSelect: () => void;
  thumbnailUrl: string | null;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        textAlign: "left",
        padding: "6px 10px",
        border: "none",
        borderRadius: 4,
        background: isSelected ? "var(--card-border-color)" : "transparent",
        cursor: "pointer",
        color: "var(--card-fg-color)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 34,
          borderRadius: 3,
          overflow: "hidden",
          flexShrink: 0,
          background: "var(--card-border-color)",
        }}
      >
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
      </div>
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
          {post.titleJa ?? "（タイトルなし）"}
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
          {post.hasDraft && (
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
          {formatDate(post.publishedAt)}
          {post.isDraftOnly && <span style={{ color: "#e6a317" }}>未公開</span>}
          {post.categoryJa && ` · ${post.categoryJa}`}
        </div>
      </div>
    </button>
  );
}

// ── Main component ───────────────────────────────────────

export function BlogPostsTool() {
  const client = useClient({ apiVersion: "2024-01-01" });

  const builder = useMemo(() => createImageUrlBuilder(client), [client]);

  // List state
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Category filter
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("");

  // Selection → opens editor
  const deepLinkId = useDeepLink("blog");
  const [editingId, setEditingId] = useState<string | null>(deepLinkId);

  // Preview state
  const [mergedDoc, setMergedDoc] = useState<BlogPostDoc | null>(null);

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
    setRightPanel({
      type: "imagePicker",
      onSelect,
    });
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

  // ── Fetch categories ─────────────────────────────────

  useEffect(() => {
    client
      .fetch<string[]>(
        `array::unique(*[_type == "blogPost" && defined(category)].category[_key == "ja"][0].value)`,
      )
      .then((cats) => setCategories(cats.filter(Boolean).sort()))
      .catch(console.error);
  }, [client]);

  // ── Fetch posts ──────────────────────────────────────

  const fetchPosts = useCallback(
    (currentPage: number, search: string, category: string) => {
      setLoading(true);
      const filter = buildFilter(search, category);
      const start = currentPage * PAGE_SIZE;
      const end = start + PAGE_SIZE;

      Promise.all([
        client.fetch<BlogPostItem[]>(
          `*[${filter}] | order(publishedAt desc) [${start}...${end}] ${LIST_PROJECTION}`,
        ),
        client.fetch<number>(`count(*[${filter}])`),
      ])
        .then(([items, count]) => {
          setPosts(items);
          setTotalCount(count);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    },
    [client],
  );

  useEffect(() => {
    fetchPosts(page, searchQuery, activeCategory);
  }, [fetchPosts, page, searchQuery, activeCategory]);

  // Real-time listener
  useEffect(() => {
    const subscription = client
      .listen('*[_type == "blogPost"]')
      .subscribe(() => fetchPosts(page, searchQuery, activeCategory));
    return () => subscription.unsubscribe();
  }, [client, fetchPosts, page, searchQuery, activeCategory]);

  // ── Handlers ─────────────────────────────────────────

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      setSearchQuery(value);
    }, 300);
  }

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat);
    setPage(0);
  }

  async function handleCreate() {
    try {
      const id = crypto.randomUUID().replace(/-/g, "").slice(0, 22);
      await client.create({
        _id: `drafts.${id}`,
        _type: "blogPost",
        title: [
          { _key: "ja", value: "新しい記事" },
          { _key: "en", value: "" },
        ],
      });
      setEditingId(id);
    } catch (err) {
      console.error("Create failed:", err);
    }
  }

  // ── Render ────────────────────────────────────────────

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* ── Left: Post list sidebar ── */}
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
                ブログ
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
            {categories.length > 0 && (
              <Flex gap={1} wrap="wrap">
                <Button
                  text="すべて"
                  mode={activeCategory === "" ? "default" : "ghost"}
                  tone={activeCategory === "" ? "primary" : "default"}
                  fontSize={0}
                  padding={1}
                  onClick={() => handleCategoryChange("")}
                />
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    text={cat}
                    mode={activeCategory === cat ? "default" : "ghost"}
                    tone={activeCategory === cat ? "primary" : "default"}
                    fontSize={0}
                    padding={1}
                    onClick={() => handleCategoryChange(cat)}
                  />
                ))}
              </Flex>
            )}
          </Stack>
        </Box>

        {/* Sidebar post list */}
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
              opacity: loading && posts.length > 0 ? 0.5 : 1,
              pointerEvents: loading && posts.length > 0 ? "none" : "auto",
              transition: "opacity 150ms ease",
            }}
          >
            {!loading && posts.length === 0 ? (
              <Box padding={3}>
                {searchQuery || activeCategory ? (
                  <Text size={0} muted>
                    検索結果がありません
                  </Text>
                ) : (
                  <Flex direction="column" align="center" gap={3} paddingY={4}>
                    <Text size={0} muted>
                      ブログ記事がありません
                    </Text>
                    <Button
                      icon={AddIcon}
                      text="最初の記事を作成"
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
                {posts.map((post) => (
                  <SidebarRow
                    key={post._id}
                    post={post}
                    isSelected={post._id === editingId}
                    onSelect={() => {
                      setEditingId(post._id);
                      setRightPanel(null);
                    }}
                    thumbnailUrl={
                      post.heroImage?.asset?._ref
                        ? builder
                            .image(post.heroImage)
                            .width(96)
                            .height(68)
                            .fit("crop")
                            .auto("format")
                            .url()
                        : null
                    }
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
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {editingId ? (
          <PostEditor
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
              fetchPosts(page, searchQuery, activeCategory);
            }}
            onMergedChange={setMergedDoc}
            onDraftChange={() => fetchPosts(page, searchQuery, activeCategory)}
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
              記事を選択してください
            </Text>
            <Button
              icon={AddIcon}
              text="新しい記事を作成"
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
            <BlogPostPreview doc={mergedDoc} />
          </PreviewPanel>
        </RightPanel>
      ) : null}
    </div>
  );
}
