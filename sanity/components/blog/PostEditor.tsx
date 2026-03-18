"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text, TextInput } from "@sanity/ui";
import { PublishIcon, TrashIcon, RevertIcon } from "@sanity/icons";
import createImageUrlBuilder from "@sanity/image-url";
import type { PortableTextBlock } from "@portabletext/editor";
import { HotspotCropTool, DEFAULT_HOTSPOT, DEFAULT_CROP } from "../shared/HotspotCropTool";
import { i18nGet, i18nSet, i18nGetBody, i18nSetBody } from "../shared/i18n";
import { LoadingDots } from "../shared/ui";
import { RawJsonButton } from "../shared/RawJsonViewer";
import { BodyEditor } from "./PteEditor";
import type { GalleryImageItem } from "./GalleryPanel";

// ── Types ────────────────────────────────────────────────

export interface BlogPostDoc {
  _id: string;
  _rev?: string;
  _updatedAt?: string;
  title: { _key: string; value: string }[] | null;
  slug: { current: string } | null;
  author: string | null;
  publishedAt: string | null;
  category: { _key: string; value: string }[] | null;
  heroImage: {
    asset?: { _ref: string };
    alt?: { _key: string; value: string }[];
    hotspot?: { x: number; y: number; width: number; height: number };
    crop?: { top: number; bottom: number; left: number; right: number };
  } | null;
  excerpt: { _key: string; value: string }[] | null;
  body: { _key: string; value: PortableTextBlock[] }[] | null;
  documents: DocumentLinkItem[] | null;
  relatedPosts: RelatedPostRef[] | null;
}

interface DocumentLinkItem {
  _key: string;
  _type: "documentLink";
  label?: { _key: string; value: string }[];
  file?: { asset: { _ref: string } };
  url?: string;
  type?: string;
  fileType?: string;
}

interface RelatedPostRef {
  _key: string;
  _type: "reference";
  _ref: string;
}

interface RelatedPostDisplay {
  _id: string;
  titleJa: string | null;
  slug: string | null;
}

// ── Constants ────────────────────────────────────────────

export const DOC_PROJECTION = `{
  _id, _rev, _updatedAt, title, slug, author, publishedAt, category,
  heroImage, excerpt, body, documents,
  "relatedPosts": relatedPosts[] { _key, _type, _ref }
}`;

// ── Helpers ──────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "下書き";
  return new Date(dateStr).toLocaleDateString("ja-JP");
}

function formatRelativeTime(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  return new Date(dateStr).toLocaleDateString("ja-JP");
}

// ── PostEditor ───────────────────────────────────────────

export function PostEditor({
  documentId,
  onOpenImagePicker,
  onOpenGalleryEditor,
  activeGalleryBlockKey,
  onDeselectGallery,
  onDelete,
  onMergedChange,
  onDraftChange,
  onOpenFilePicker,
}: {
  documentId: string;
  onOpenImagePicker: (onSelect: (assetId: string) => void) => void;
  onOpenGalleryEditor: (
    blockKey: string,
    images: GalleryImageItem[],
    onUpdate: (images: GalleryImageItem[]) => void,
  ) => void;
  activeGalleryBlockKey: string | null;
  onDeselectGallery: () => void;
  onDelete: () => void;
  onMergedChange?: (doc: BlogPostDoc | null) => void;
  onDraftChange?: () => void;
  onOpenFilePicker?: (onSelect: (assetId: string, filename: string, ext: string) => void) => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = createImageUrlBuilder(client);

  const [publishedDoc, setPublishedDoc] = useState<BlogPostDoc | null>(null);
  const [draftDoc, setDraftDoc] = useState<BlogPostDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "dirty" | "saving" | "discarding" | "error"
  >("saved");
  const [bodyLang, setBodyLang] = useState<"ja" | "en">("ja");
  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const [frozenHeight, setFrozenHeight] = useState<number | null>(null);
  const [showHotspotCrop, setShowHotspotCrop] = useState(false);

  const handleBodyLangChange = useCallback((lang: "ja" | "en") => {
    if (bodyContainerRef.current) {
      setFrozenHeight(bodyContainerRef.current.offsetHeight);
    }
    setBodyLang(lang);
    // Release the frozen height after the editor has mounted
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setFrozenHeight(null));
    });
  }, []);

  // Always show draft if available, otherwise published
  const doc = draftDoc ?? publishedDoc;
  const hasDraft = draftDoc !== null;

  // Track local edits (only apply when viewing draft)
  const [edits, setEdits] = useState<Partial<BlogPostDoc>>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Merged doc = fetched + local edits
  const merged = useMemo(() => {
    if (!doc) return null;
    return { ...doc, ...edits } as BlogPostDoc;
  }, [doc, edits]);

  // Notify parent of merged doc changes for preview
  useEffect(() => {
    onMergedChange?.(merged);
  }, [merged, onMergedChange]);

  // ── Load document ──────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    const pubId = documentId.replace(/^drafts\./, "");
    const draftId = `drafts.${pubId}`;

    Promise.all([
      client.fetch<BlogPostDoc | null>(`*[_id == $id][0] ${DOC_PROJECTION}`, { id: pubId }),
      client.fetch<BlogPostDoc | null>(`*[_id == $id][0] ${DOC_PROJECTION}`, { id: draftId }),
    ])
      .then(([pub, draft]) => {
        setPublishedDoc(pub);
        setDraftDoc(draft);
        setEdits({});
        setSaveStatus("saved");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [client, documentId]);

  // ── Auto-save ──────────────────────────────────────────

  const saveToSanity = useCallback(
    async (updates: Partial<BlogPostDoc>) => {
      const baseDoc = draftDoc ?? publishedDoc;
      if (!baseDoc) return;
      setSaving(true);
      setSaveStatus("saving");
      try {
        const pubId = documentId.replace(/^drafts\./, "");
        const draftId = `drafts.${pubId}`;
        // Ensure draft exists
        await client.createIfNotExists({
          ...baseDoc,
          _id: draftId,
          _type: "blogPost",
        });
        await client.patch(draftId).set(updates).commit();
        // Re-fetch draft to get updated _updatedAt
        const updated = await client.fetch<BlogPostDoc | null>(
          `*[_id == $id][0] ${DOC_PROJECTION}`,
          { id: draftId },
        );
        if (updated) setDraftDoc(updated);
        setSaveStatus("saved");
      } catch (err) {
        console.error("Save failed:", err);
        setSaveStatus("error");
      } finally {
        setSaving(false);
      }
    },
    [client, documentId, draftDoc, publishedDoc],
  );

  function updateField(field: string, value: unknown) {
    setEdits((prev) => ({ ...prev, [field]: value }));
    setSaveStatus("dirty");

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveToSanity({ ...edits, [field]: value });
    }, 1500);
  }

  // ── Publish ────────────────────────────────────────────

  async function handlePublish() {
    if (!merged) return;
    try {
      setSaving(true);
      setSaveStatus("saving");
      const pubId = documentId.replace(/^drafts\./, "");
      const draftId = `drafts.${pubId}`;

      // Get latest draft
      const draft = await client.fetch<BlogPostDoc | null>(
        `*[_id == $draftId][0] ${DOC_PROJECTION}`,
        { draftId },
      );
      const source = draft ?? merged;

      // Create/replace published version
      const { _rev, _updatedAt, ...rest } = source;
      await client.createOrReplace({
        ...rest,
        _id: pubId,
        _type: "blogPost",
      });

      // Delete draft
      await client.delete(draftId).catch(() => {});

      // Refresh state
      const newPub = await client.fetch<BlogPostDoc | null>(`*[_id == $id][0] ${DOC_PROJECTION}`, {
        id: pubId,
      });
      setPublishedDoc(newPub);
      setDraftDoc(null);
      setEdits({});
      setSaveStatus("saved");
      onDraftChange?.();
    } catch (err) {
      console.error("Publish failed:", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  // ── Discard draft ──────────────────────────────────────

  async function handleDiscardDraft() {
    if (!confirm("下書きを破棄しますか？公開中の内容に戻ります。")) return;
    setSaving(true);
    setSaveStatus("discarding");
    const pubId = documentId.replace(/^drafts\./, "");
    const draftId = `drafts.${pubId}`;
    try {
      await client.delete(draftId).catch(() => {});
      const freshPub = await client.fetch<BlogPostDoc | null>(
        `*[_id == $id][0] ${DOC_PROJECTION}`,
        { id: pubId },
      );
      setPublishedDoc(freshPub);
      setDraftDoc(null);
      setEdits({});
      setSaveStatus("saved");
      onDraftChange?.();
    } catch (err) {
      console.error("Discard draft failed:", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete post ───────────────────────────────────────

  async function handleDeletePost() {
    const label = !publishedDoc ? "この下書き" : "この記事（公開版・下書き含む）";
    if (!confirm(`${label}を完全に削除しますか？この操作は元に戻せません。`)) return;
    const pubId = documentId.replace(/^drafts\./, "");
    const draftId = `drafts.${pubId}`;
    try {
      await client.delete(draftId).catch(() => {});
      await client.delete(pubId).catch(() => {});
      onDelete();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  // ── Image selection ──────────────────────────────────

  function handleHeroImagePick() {
    onOpenImagePicker((assetId: string) => {
      updateField("heroImage", {
        _type: "image",
        asset: { _type: "reference", _ref: assetId },
      });
    });
  }

  // ── Documents ─────────────────────────────────────────

  function handleRemoveDocument(key: string) {
    const docs = (merged?.documents ?? []).filter((d) => d._key !== key);
    updateField("documents", docs);
  }

  function handleAddUrlDocument(label: string, url: string) {
    const docs = merged?.documents ?? [];
    const newDoc: DocumentLinkItem = {
      _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
      _type: "documentLink",
      label: [{ _key: "ja", value: label }],
      url,
      type: url.includes("youtube") ? "youtube" : "website",
    };
    updateField("documents", [...docs, newDoc]);
  }

  function handleFilePick() {
    onOpenFilePicker?.((assetId, filename, ext) => {
      const docs = merged?.documents ?? [];
      const newDoc: DocumentLinkItem = {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        _type: "documentLink",
        label: [{ _key: "ja", value: filename }],
        file: { asset: { _ref: assetId } },
        type: "document",
        fileType: ext,
      };
      updateField("documents", [...docs, newDoc]);
    });
  }

  // ── Related posts ──────────────────────────────────────

  function handleRemoveRelatedPost(ref: string) {
    const posts = (merged?.relatedPosts ?? []).filter((r) => r._ref !== ref);
    updateField("relatedPosts", posts);
  }

  function handleAddRelatedPost(postId: string) {
    const posts = merged?.relatedPosts ?? [];
    if (posts.some((r) => r._ref === postId)) return;
    updateField("relatedPosts", [
      ...posts,
      {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        _type: "reference" as const,
        _ref: postId,
      },
    ]);
  }

  // ── Render ─────────────────────────────────────────────

  const slug = merged?.slug?.current ?? null;
  const previewUrl = slug ? `/blog/${slug}?preview` : null;

  const statusLabel: Record<string, string> = {
    saved: "保存済み",
    dirty: "未保存",
    saving: "保存中…",
    discarding: "破棄中…",
    error: "保存エラー",
  };
  const statusTone: Record<string, string> = {
    saved: "var(--card-muted-fg-color)",
    dirty: "#b08000",
    saving: "var(--card-muted-fg-color)",
    discarding: "#b08000",
    error: "#cc3333",
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box padding={3} style={{ borderBottom: "1px solid var(--card-border-color)" }}>
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={2}>
            {/* Status badge */}
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 600,
                background: hasDraft ? "#f5a623" : "#4caf50",
                color: "#fff",
              }}
            >
              {hasDraft ? "下書き" : "公開済み"}
            </span>
            <Text size={0} style={{ color: statusTone[saveStatus] }}>
              {statusLabel[saveStatus]}
            </Text>
            {draftDoc?._updatedAt && (
              <Text size={0} muted>
                {formatRelativeTime(draftDoc._updatedAt)}
              </Text>
            )}
          </Flex>
          <Flex align="center" gap={2}>
            {hasDraft && publishedDoc && (
              <Button
                icon={RevertIcon}
                text="下書きを破棄"
                mode="ghost"
                tone="caution"
                fontSize={0}
                padding={2}
                onClick={handleDiscardDraft}
                disabled={saving}
              />
            )}
            <Button
              icon={TrashIcon}
              mode="ghost"
              tone="critical"
              fontSize={0}
              padding={2}
              onClick={handleDeletePost}
              disabled={saving}
            />
            <Button
              icon={PublishIcon}
              text="公開"
              tone="positive"
              fontSize={1}
              padding={2}
              onClick={handlePublish}
              disabled={saving || !hasDraft}
            />
          </Flex>
        </Flex>
      </Box>

      {/* Content area — title, metadata, body editor */}
      {!merged ? (
        <Flex flex={1} align="center" justify="center">
          <LoadingDots />
        </Flex>
      ) : (
        <div
          style={{
            flex: 1,
            overflow: "auto",
          }}
        >
          <div
            style={{
              maxWidth: 720,
              width: "100%",
              margin: "0 auto",
              padding: "16px 24px",
            }}
          >
            {/* Hero image — compact inline */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
                ヒーロー画像
              </div>
              {merged.heroImage?.asset?._ref ? (
                <div
                  style={{
                    position: "relative",
                    borderRadius: 6,
                    overflow: "hidden",
                    lineHeight: 0,
                  }}
                >
                  <img
                    src={builder
                      .image(merged.heroImage)
                      .width(720)
                      .height(180)
                      .fit("crop")
                      .auto("format")
                      .url()}
                    alt=""
                    style={{
                      width: "100%",
                      maxHeight: 180,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      display: "flex",
                      gap: 4,
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleHeroImagePick}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 4,
                        border: "none",
                        background: "rgba(0,0,0,0.55)",
                        color: "#fff",
                        fontSize: 11,
                        cursor: "pointer",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      変更
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHotspotCrop(true)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 4,
                        border: "none",
                        background: "rgba(0,0,0,0.55)",
                        color: "#fff",
                        fontSize: 11,
                        cursor: "pointer",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      切り抜き
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("heroImage", null)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 4,
                        border: "none",
                        background: "rgba(0,0,0,0.55)",
                        color: "#fff",
                        fontSize: 11,
                        cursor: "pointer",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleHeroImagePick}
                  style={{
                    width: "100%",
                    padding: "20px 0",
                    border: "1px dashed var(--card-border-color)",
                    borderRadius: 6,
                    background: "transparent",
                    color: "var(--card-muted-fg-color)",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  + 画像を追加
                </button>
              )}
            </div>

            {/* Title fields */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
                タイトル（日本語）
              </div>
              <TextInput
                fontSize={2}
                value={i18nGet(merged.title, "ja")}
                onChange={(e) =>
                  updateField("title", i18nSet(merged.title, "ja", e.currentTarget.value))
                }
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
                タイトル（English）
              </div>
              <TextInput
                fontSize={1}
                value={i18nGet(merged.title, "en")}
                onChange={(e) =>
                  updateField("title", i18nSet(merged.title, "en", e.currentTarget.value))
                }
              />
            </div>

            {/* Inline metadata grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px 16px",
                padding: "16px 0",
                borderTop: "1px solid var(--card-border-color)",
                borderBottom: "1px solid var(--card-border-color)",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
                  スラッグ
                </div>
                <TextInput
                  fontSize={0}
                  value={merged.slug?.current ?? ""}
                  onChange={(e) =>
                    updateField("slug", { _type: "slug", current: e.currentTarget.value })
                  }
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
                  公開日
                </div>
                <TextInput
                  fontSize={0}
                  type="date"
                  value={merged.publishedAt ? merged.publishedAt.slice(0, 10) : ""}
                  onChange={(e) => {
                    const val = e.currentTarget.value;
                    updateField("publishedAt", val ? new Date(val).toISOString() : null);
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
                  著者
                </div>
                <TextInput
                  fontSize={0}
                  value={merged.author ?? ""}
                  onChange={(e) => updateField("author", e.currentTarget.value)}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
                  カテゴリー
                </div>
                <TextInput
                  fontSize={0}
                  value={i18nGet(merged.category, "ja")}
                  onChange={(e) =>
                    updateField("category", i18nSet(merged.category, "ja", e.currentTarget.value))
                  }
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
                  抜粋（日本語）
                </div>
                <textarea
                  rows={1}
                  value={i18nGet(merged.excerpt, "ja")}
                  onChange={(e) =>
                    updateField("excerpt", i18nSet(merged.excerpt, "ja", e.target.value))
                  }
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    border: "1px solid var(--card-border-color)",
                    borderRadius: 4,
                    fontSize: 13,
                    fontFamily: "inherit",
                    resize: "vertical",
                    background: "transparent",
                    color: "inherit",
                  }}
                />
              </div>
            </div>

            {/* Language toggle + body editor */}
            <div
              ref={bodyContainerRef}
              style={{
                minHeight: frozenHeight ?? undefined,
              }}
            >
              {/* Language toggle */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingBottom: 6,
                }}
              >
                <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)" }}>本文</div>
                <div
                  style={{
                    display: "inline-flex",
                    border: "1px solid var(--card-border-color)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  {(["ja", "en"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => handleBodyLangChange(l)}
                      style={{
                        display: "block",
                        padding: "3px 0",
                        width: 44,
                        textAlign: "center",
                        border: "none",
                        margin: 0,
                        cursor: "pointer",
                        fontSize: 11,
                        lineHeight: "18px",
                        fontWeight: bodyLang === l ? 600 : 400,
                        background: bodyLang === l ? "var(--card-fg-color)" : "transparent",
                        color:
                          bodyLang === l ? "var(--card-bg-color)" : "var(--card-muted-fg-color)",
                      }}
                    >
                      {l === "ja" ? "日本語" : "EN"}
                    </button>
                  ))}
                </div>
              </div>
              <BodyEditor
                key={`${merged._id}-${bodyLang}`}
                initialValue={i18nGetBody(merged.body, bodyLang)}
                onChange={(value) => updateField("body", i18nSetBody(merged.body, bodyLang, value))}
                onOpenImagePicker={onOpenImagePicker}
                onOpenGalleryEditor={onOpenGalleryEditor}
                activeGalleryBlockKey={activeGalleryBlockKey}
                onDeselectGallery={onDeselectGallery}
              />
            </div>

            {/* Documents section */}
            <DocumentsSection
              documents={merged.documents ?? []}
              onRemove={handleRemoveDocument}
              onAddUrl={handleAddUrlDocument}
              onPickFile={handleFilePick}
            />

            {/* Related posts section */}
            <RelatedPostsSection
              client={client}
              relatedPosts={merged.relatedPosts ?? []}
              currentPostId={merged._id}
              onAdd={handleAddRelatedPost}
              onRemove={handleRemoveRelatedPost}
            />
          </div>
        </div>
      )}

      {/* Hotspot & crop dialog */}
      {showHotspotCrop && merged?.heroImage?.asset?._ref && (
        <HotspotCropTool
          imageUrl={builder.image(merged.heroImage).width(1200).auto("format").url()}
          value={{
            hotspot: merged.heroImage.hotspot ?? DEFAULT_HOTSPOT,
            crop: merged.heroImage.crop ?? DEFAULT_CROP,
          }}
          onChange={({ hotspot, crop }) => {
            updateField("heroImage", {
              ...merged.heroImage,
              hotspot: { _type: "sanity.imageHotspot", ...hotspot },
              crop: { _type: "sanity.imageCrop", ...crop },
            });
          }}
          onClose={() => setShowHotspotCrop(false)}
        />
      )}

      {merged && <RawJsonButton getDocument={() => merged} />}
    </div>
  );
}

// ── Documents Section ───────────────────────────────────

function DocumentsSection({
  documents,
  onRemove,
  onAddUrl,
  onPickFile,
}: {
  documents: DocumentLinkItem[];
  onRemove: (key: string) => void;
  onAddUrl: (label: string, url: string) => void;
  onPickFile: () => void;
}) {
  const [showAddUrl, setShowAddUrl] = useState(false);
  const [urlLabel, setUrlLabel] = useState("");
  const [urlValue, setUrlValue] = useState("");

  function handleSubmitUrl() {
    if (!urlLabel.trim() || !urlValue.trim()) return;
    onAddUrl(urlLabel.trim(), urlValue.trim());
    setUrlLabel("");
    setUrlValue("");
    setShowAddUrl(false);
  }

  const typeLabels: Record<string, string> = {
    document: "PDF",
    youtube: "YouTube",
    website: "Web",
  };

  return (
    <div
      style={{
        marginTop: 24,
        paddingTop: 16,
        borderTop: "1px solid var(--card-border-color)",
      }}
    >
      <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
        添付資料
      </div>

      {documents.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {documents.map((doc) => {
            const label = doc.label?.find((l) => l._key === "ja")?.value ?? "（無題）";
            const typeLabel = doc.type ? (typeLabels[doc.type] ?? doc.type) : "";
            const fileTypeLabel = doc.fileType ?? "";
            const subtitle = [typeLabel, fileTypeLabel].filter(Boolean).join(" · ");

            return (
              <div
                key={doc._key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 4,
                  border: "1px solid var(--card-border-color)",
                  fontSize: 13,
                }}
              >
                <span style={{ fontSize: 14 }}>{doc.file ? "\u{1F4CE}" : "\u{1F517}"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </div>
                  {subtitle && (
                    <div style={{ fontSize: 11, color: "var(--card-muted-fg-color)" }}>
                      {subtitle}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(doc._key)}
                  style={{
                    padding: "2px 6px",
                    border: "none",
                    borderRadius: 3,
                    background: "transparent",
                    color: "var(--card-muted-fg-color)",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                  title="削除"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showAddUrl ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: 12,
            border: "1px solid var(--card-border-color)",
            borderRadius: 6,
            marginBottom: 8,
          }}
        >
          <TextInput
            fontSize={0}
            placeholder="ラベル（例：申込書）"
            value={urlLabel}
            onChange={(e) => setUrlLabel(e.currentTarget.value)}
          />
          <TextInput
            fontSize={0}
            placeholder="URL（https://...）"
            value={urlValue}
            onChange={(e) => setUrlValue(e.currentTarget.value)}
          />
          <Flex gap={2}>
            <Button
              text="追加"
              tone="primary"
              fontSize={0}
              padding={2}
              onClick={handleSubmitUrl}
              disabled={!urlLabel.trim() || !urlValue.trim()}
            />
            <Button
              text="キャンセル"
              mode="ghost"
              fontSize={0}
              padding={2}
              onClick={() => {
                setShowAddUrl(false);
                setUrlLabel("");
                setUrlValue("");
              }}
            />
          </Flex>
        </div>
      ) : (
        <Flex gap={2}>
          <Button
            text="+ URLを追加"
            mode="ghost"
            fontSize={0}
            padding={2}
            onClick={() => setShowAddUrl(true)}
          />
          <Button
            text="+ ファイルを選択"
            mode="ghost"
            fontSize={0}
            padding={2}
            onClick={onPickFile}
          />
        </Flex>
      )}
    </div>
  );
}

// ── Related Posts Section ────────────────────────────────

function RelatedPostsSection({
  client: sanityClient,
  relatedPosts,
  currentPostId,
  onAdd,
  onRemove,
}: {
  client: ReturnType<typeof useClient>;
  relatedPosts: RelatedPostRef[];
  currentPostId: string;
  onAdd: (postId: string) => void;
  onRemove: (ref: string) => void;
}) {
  const [resolvedPosts, setResolvedPosts] = useState<RelatedPostDisplay[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<RelatedPostDisplay[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve related post references to display data
  useEffect(() => {
    if (relatedPosts.length === 0) {
      setResolvedPosts([]);
      return;
    }
    const refs = relatedPosts.map((r) => r._ref);
    sanityClient
      .fetch<
        RelatedPostDisplay[]
      >(`*[_type == "blogPost" && _id in $refs] { _id, "titleJa": title[_key == "ja"][0].value, "slug": slug.current }`, { refs })
      .then(setResolvedPosts)
      .catch(console.error);
  }, [sanityClient, relatedPosts]);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(() => {
      setSearching(true);
      const currentPubId = currentPostId.replace(/^drafts\./, "");
      const terms = value
        .trim()
        .split(/\s+/)
        .map((t) => `"${t}*"`)
        .join(", ");
      sanityClient
        .fetch<RelatedPostDisplay[]>(
          `*[_type == "blogPost" && !(_id in path("drafts.**")) && _id != $currentId && (title[_key == "ja"][0].value match [${terms}] || title[_key == "en"][0].value match [${terms}])] | order(publishedAt desc) [0...10] { _id, "titleJa": title[_key == "ja"][0].value, "slug": slug.current }`,
          { currentId: currentPubId },
        )
        .then(setSearchResults)
        .catch(console.error)
        .finally(() => setSearching(false));
    }, 300);
  }

  const existingRefs = new Set(relatedPosts.map((r) => r._ref));

  return (
    <div
      style={{
        marginTop: 24,
        paddingTop: 16,
        borderTop: "1px solid var(--card-border-color)",
      }}
    >
      <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
        関連記事
      </div>

      {resolvedPosts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {relatedPosts.map((ref) => {
            const resolved = resolvedPosts.find((p) => p._id === ref._ref);
            return (
              <div
                key={ref._key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 4,
                  border: "1px solid var(--card-border-color)",
                  fontSize: 13,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {resolved?.titleJa ?? ref._ref}
                  </div>
                  {resolved?.slug && (
                    <div style={{ fontSize: 11, color: "var(--card-muted-fg-color)" }}>
                      /blog/{resolved.slug}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(ref._ref)}
                  style={{
                    padding: "2px 6px",
                    border: "none",
                    borderRadius: 3,
                    background: "transparent",
                    color: "var(--card-muted-fg-color)",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                  title="削除"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showSearch ? (
        <div
          style={{
            border: "1px solid var(--card-border-color)",
            borderRadius: 6,
            padding: 12,
          }}
        >
          <TextInput
            fontSize={0}
            placeholder="記事を検索…"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.currentTarget.value)}
            autoFocus
          />
          <div style={{ marginTop: 8, maxHeight: 200, overflow: "auto" }}>
            {searching && (
              <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", padding: 4 }}>
                検索中…
              </div>
            )}
            {!searching && searchInput.trim() && searchResults.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", padding: 4 }}>
                見つかりません
              </div>
            )}
            {searchResults.map((post) => {
              const alreadyAdded = existingRefs.has(post._id);
              return (
                <button
                  key={post._id}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => {
                    onAdd(post._id);
                    setSearchInput("");
                    setSearchResults([]);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "6px 8px",
                    border: "none",
                    borderRadius: 3,
                    background: "transparent",
                    cursor: alreadyAdded ? "default" : "pointer",
                    opacity: alreadyAdded ? 0.4 : 1,
                    fontSize: 13,
                    color: "var(--card-fg-color)",
                  }}
                >
                  {post.titleJa ?? "（タイトルなし）"}
                  {post.slug && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--card-muted-fg-color)",
                        marginLeft: 8,
                      }}
                    >
                      /blog/{post.slug}
                    </span>
                  )}
                  {alreadyAdded && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--card-muted-fg-color)",
                        marginLeft: 8,
                      }}
                    >
                      追加済み
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              setShowSearch(false);
              setSearchInput("");
              setSearchResults([]);
            }}
            style={{
              marginTop: 8,
              padding: "4px 10px",
              border: "none",
              borderRadius: 4,
              background: "transparent",
              color: "var(--card-muted-fg-color)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            閉じる
          </button>
        </div>
      ) : (
        <Button
          text="+ 関連記事を追加"
          mode="ghost"
          fontSize={0}
          padding={2}
          onClick={() => setShowSearch(true)}
        />
      )}
    </div>
  );
}
