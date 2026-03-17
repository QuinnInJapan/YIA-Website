"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { AddIcon, SearchIcon } from "@sanity/icons";
import createImageUrlBuilder from "@sanity/image-url";
import { Pagination } from "./shared/ui";
import { ImagePickerPanel } from "./shared/ImagePickerPanel";
import { PostEditor } from "./blog/PostEditor";
import { CombinedGalleryPanel, type GalleryImageItem } from "./blog/GalleryPanel";

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
  _id,
  "titleJa": title[_key == "ja"][0].value,
  "titleEn": title[_key == "en"][0].value,
  publishedAt,
  "categoryJa": category[_key == "ja"][0].value,
  "slug": slug.current,
  heroImage,
  "hasDraft": defined(*[_id == "drafts." + ^._id][0])
}`;

function buildFilter(search: string, category: string): string {
  let filter = `_type == "blogPost" && !(_id in path("drafts.**"))`;
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
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Right panel state
  const [rightPanel, setRightPanel] = useState<
    | { type: "imagePicker"; onSelect: (assetId: string) => void }
    | {
        type: "galleryEditor";
        blockKey: string;
        initialImages: GalleryImageItem[];
        onUpdateImages: (images: GalleryImageItem[]) => void;
      }
    | null
  >(null);

  const handleOpenImagePicker = useCallback((onSelect: (assetId: string) => void) => {
    setRightPanel({
      type: "imagePicker",
      onSelect,
    });
  }, []);

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
          width: sidebarCollapsed ? 60 : 340,
          flexShrink: 0,
          borderRight: "1px solid var(--card-border-color)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "width 200ms ease",
        }}
      >
        {sidebarCollapsed ? (
          /* Collapsed sidebar: expand button + thumbnail strip */
          <>
            <Box padding={2} style={{ borderBottom: "1px solid var(--card-border-color)" }}>
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  border: "none",
                  borderRadius: 4,
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--card-fg-color)",
                  margin: "0 auto",
                }}
                title="サイドバーを展開"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6 3l5 5-5 5V3z" />
                </svg>
              </button>
            </Box>
            <div style={{ flex: 1, overflow: "auto", padding: 4 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {posts.map((post) => {
                  const isSelected = post._id === editingId;
                  const thumbUrl = post.heroImage?.asset?._ref
                    ? builder
                        .image(post.heroImage)
                        .width(88)
                        .height(88)
                        .fit("crop")
                        .auto("format")
                        .url()
                    : null;
                  return (
                    <button
                      key={post._id}
                      type="button"
                      onClick={() => {
                        setEditingId(post._id);
                        setRightPanel(null);
                      }}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 4,
                        overflow: "hidden",
                        border: isSelected
                          ? "2px solid var(--card-focus-ring-color, #4a90d9)"
                          : "1px solid var(--card-border-color)",
                        padding: 0,
                        cursor: "pointer",
                        background: "var(--card-border-color)",
                        margin: "0 auto",
                        flexShrink: 0,
                      }}
                      title={post.titleJa ?? "（タイトルなし）"}
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            color: "var(--card-muted-fg-color)",
                          }}
                        >
                          {(post.titleJa ?? "?")[0]}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* Expanded sidebar */
          <>
            {/* Sidebar header */}
            <Box padding={3} style={{ borderBottom: "1px solid var(--card-border-color)" }}>
              <Stack space={3}>
                <Flex align="center" justify="space-between">
                  <Flex align="center" gap={2}>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => setSidebarCollapsed(true)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 28,
                          height: 28,
                          border: "none",
                          borderRadius: 4,
                          background: "transparent",
                          cursor: "pointer",
                          color: "var(--card-muted-fg-color)",
                        }}
                        title="サイドバーを折りたたむ"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M10 3l-5 5 5 5V3z" />
                        </svg>
                      </button>
                    )}
                    <Text size={1} weight="semibold">
                      ブログ
                    </Text>
                  </Flex>
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
                    <Text size={0} muted>
                      {searchQuery || activeCategory
                        ? "検索結果がありません"
                        : "ブログ記事がありません"}
                    </Text>
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
                          setSidebarCollapsed(true);
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
          </>
        )}
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
              fetchPosts(page, searchQuery, activeCategory);
            }}
          />
        ) : (
          <Flex
            align="center"
            justify="center"
            style={{ height: "100%", color: "var(--card-muted-fg-color)" }}
          >
            <Text size={1} muted>
              記事を選択してください
            </Text>
          </Flex>
        )}
      </div>

      {/* ── Right: Contextual panel (only when active) ── */}
      {rightPanel && (
        <div
          style={{
            width: 420,
            flexShrink: 0,
            borderLeft: "1px solid var(--card-border-color)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {rightPanel.type === "imagePicker" ? (
            <ImagePickerPanel onSelect={rightPanel.onSelect} onClose={() => setRightPanel(null)} />
          ) : rightPanel.type === "galleryEditor" ? (
            <CombinedGalleryPanel
              key={rightPanel.blockKey}
              initialImages={rightPanel.initialImages}
              onUpdateImages={rightPanel.onUpdateImages}
              onClose={() => setRightPanel(null)}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
