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
}

// ── Constants ────────────────────────────────────────────

export const DOC_PROJECTION = `{
  _id, _rev, _updatedAt, title, slug, author, publishedAt, category,
  heroImage, excerpt, body
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
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = createImageUrlBuilder(client);

  const [publishedDoc, setPublishedDoc] = useState<BlogPostDoc | null>(null);
  const [draftDoc, setDraftDoc] = useState<BlogPostDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "dirty" | "saving" | "error">("saved");
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

  // Read-only when there's only a published doc (no draft)
  const isReadOnly = !hasDraft;

  async function handleCreateDraft() {
    if (!publishedDoc) return;
    try {
      const pubId = documentId.replace(/^drafts\./, "");
      const draftId = `drafts.${pubId}`;
      const { _rev, _updatedAt, ...rest } = publishedDoc;
      await client.createIfNotExists({
        ...rest,
        _id: draftId,
        _type: "blogPost",
      });
      const draft = await client.fetch<BlogPostDoc | null>(`*[_id == $id][0] ${DOC_PROJECTION}`, {
        id: draftId,
      });
      setDraftDoc(draft);
      setEdits({});
    } catch (err) {
      console.error("Create draft failed:", err);
    }
  }

  function updateField(field: string, value: unknown) {
    if (isReadOnly) return;
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
    const pubId = documentId.replace(/^drafts\./, "");
    const draftId = `drafts.${pubId}`;
    try {
      await client.delete(draftId).catch(() => {});
      setDraftDoc(null);
      setEdits({});
    } catch (err) {
      console.error("Discard draft failed:", err);
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

  // ── Render ─────────────────────────────────────────────

  const slug = merged?.slug?.current ?? null;
  const previewUrl = slug ? `/blog/${slug}?preview` : null;

  const statusLabel: Record<string, string> = {
    saved: "保存済み",
    dirty: "未保存",
    saving: "保存中…",
    error: "保存エラー",
  };
  const statusTone: Record<string, string> = {
    saved: "var(--card-muted-fg-color)",
    dirty: "#b08000",
    saving: "var(--card-muted-fg-color)",
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
            {!hasDraft && publishedDoc && (
              <Button
                text="編集する"
                mode="ghost"
                fontSize={0}
                padding={2}
                onClick={handleCreateDraft}
              />
            )}
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
                    src={builder.image(merged.heroImage).width(720).auto("format").url()}
                    alt=""
                    style={{
                      width: "100%",
                      maxHeight: 180,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  {!isReadOnly && (
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
                        ホットスポット
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
                  )}
                </div>
              ) : (
                !isReadOnly && (
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
                )
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
                readOnly={isReadOnly}
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
                readOnly={isReadOnly}
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
                  readOnly={isReadOnly}
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
                  readOnly={isReadOnly}
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
                  readOnly={isReadOnly}
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
                  readOnly={isReadOnly}
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
                  readOnly={isReadOnly}
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
                readOnly={isReadOnly}
              />
            </div>
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
    </div>
  );
}
