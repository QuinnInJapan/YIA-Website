"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text, TextInput } from "@sanity/ui";
import { PublishIcon, TrashIcon, RevertIcon } from "@sanity/icons";
import createImageUrlBuilder from "@sanity/image-url";
import type { PortableTextBlock } from "@portabletext/editor";
import { DEFAULT_HOTSPOT, DEFAULT_CROP } from "../shared/HotspotCropTool";
import { i18nGet, i18nSet, i18nGetBody, i18nSetBody } from "../shared/i18n";
import { LoadingDots } from "../shared/ui";
import { RawJsonButton } from "../shared/RawJsonViewer";
import { BodyEditor } from "../blog/PteEditor";
import type { GalleryImageItem } from "../blog/GalleryPanel";

// ── Types ────────────────────────────────────────────────

export interface AnnouncementDoc {
  _id: string;
  _rev?: string;
  _updatedAt?: string;
  title: { _key: string; value: string }[] | null;
  slug: { current: string } | null;
  date: string | null;
  pinned: boolean | null;
  heroImage: {
    asset?: { _ref: string };
    alt?: { _key: string; value: string }[];
    hotspot?: { x: number; y: number; width: number; height: number };
    crop?: { top: number; bottom: number; left: number; right: number };
  } | null;
  excerpt: { _key: string; value: string }[] | null;
  body: { _key: string; value: PortableTextBlock[] }[] | null;
  documents: DocumentLinkItem[] | null;
}

interface DocumentLinkItem {
  _key: string;
  _type?: "documentLink";
  label?: { _key: string; value: string }[];
  file?: { asset?: { _ref: string } };
  url?: string;
  type?: string;
  fileType?: string;
}

// ── Constants ────────────────────────────────────────────

export const DOC_PROJECTION = `{
  _id, _rev, _updatedAt, title, slug, date, pinned,
  heroImage, excerpt, body, documents
}`;

// ── Helpers ──────────────────────────────────────────────

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

// ── AnnouncementEditor ──────────────────────────────────

export function AnnouncementEditor({
  documentId,
  onOpenImagePicker,
  onOpenGalleryEditor,
  activeGalleryBlockKey,
  onDeselectGallery,
  onDelete,
  onMergedChange,
  onDraftChange,
  onOpenFilePicker,
  onShowHotspotCrop,
  onOpenDocumentDetail,
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
  onMergedChange?: (doc: AnnouncementDoc | null) => void;
  onDraftChange?: () => void;
  onOpenFilePicker?: (onSelect: (assetId: string, filename: string, ext: string) => void) => void;
  onShowHotspotCrop?: (
    imageUrl: string,
    value: { hotspot: any; crop: any },
    onChange: (v: { hotspot: any; crop: any }) => void,
  ) => void;
  onOpenDocumentDetail?: (
    doc: DocumentLinkItem,
    onUpdate: (doc: DocumentLinkItem) => void,
    onRemove: () => void,
  ) => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = createImageUrlBuilder(client);

  const [publishedDoc, setPublishedDoc] = useState<AnnouncementDoc | null>(null);
  const [draftDoc, setDraftDoc] = useState<AnnouncementDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "dirty" | "saving" | "discarding" | "error"
  >("saved");
  const [bodyLang, setBodyLang] = useState<"ja" | "en">("ja");
  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const [frozenHeight, setFrozenHeight] = useState<number | null>(null);
  // showHotspotCrop removed — now uses onShowHotspotCrop callback

  const handleBodyLangChange = useCallback((lang: "ja" | "en") => {
    if (bodyContainerRef.current) {
      setFrozenHeight(bodyContainerRef.current.offsetHeight);
    }
    setBodyLang(lang);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setFrozenHeight(null));
    });
  }, []);

  const doc = draftDoc ?? publishedDoc;
  const hasDraft = draftDoc !== null;

  const [edits, setEdits] = useState<Partial<AnnouncementDoc>>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const merged = useMemo(() => {
    if (!doc) return null;
    return { ...doc, ...edits } as AnnouncementDoc;
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
      client.fetch<AnnouncementDoc | null>(`*[_id == $id][0] ${DOC_PROJECTION}`, { id: pubId }),
      client.fetch<AnnouncementDoc | null>(`*[_id == $id][0] ${DOC_PROJECTION}`, { id: draftId }),
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
    async (updates: Partial<AnnouncementDoc>) => {
      const baseDoc = draftDoc ?? publishedDoc;
      if (!baseDoc) return;
      setSaving(true);
      setSaveStatus("saving");
      try {
        const pubId = documentId.replace(/^drafts\./, "");
        const draftId = `drafts.${pubId}`;
        await client.createIfNotExists({
          ...baseDoc,
          _id: draftId,
          _type: "announcement",
        });
        await client.patch(draftId).set(updates).commit();
        const updated = await client.fetch<AnnouncementDoc | null>(
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

      const draft = await client.fetch<AnnouncementDoc | null>(
        `*[_id == $draftId][0] ${DOC_PROJECTION}`,
        { draftId },
      );
      const source = draft ?? merged;

      const { _rev, _updatedAt, ...rest } = source;
      await client.createOrReplace({
        ...rest,
        _id: pubId,
        _type: "announcement",
      });

      await client.delete(draftId).catch(() => {});

      const newPub = await client.fetch<AnnouncementDoc | null>(
        `*[_id == $id][0] ${DOC_PROJECTION}`,
        { id: pubId },
      );
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
      const freshPub = await client.fetch<AnnouncementDoc | null>(
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

  // ── Delete ─────────────────────────────────────────────

  async function handleDelete() {
    const label = !publishedDoc ? "この下書き" : "このお知らせ（公開版・下書き含む）";
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

  function handleUpdateDocument(key: string, updated: DocumentLinkItem) {
    const docs = (merged?.documents ?? []).map((d) => (d._key === key ? updated : d));
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

  // ── Render ─────────────────────────────────────────────

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
              onClick={handleDelete}
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

      {/* Content area */}
      {!merged ? (
        <Flex flex={1} align="center" justify="center">
          <LoadingDots />
        </Flex>
      ) : (
        <div style={{ flex: 1, overflow: "auto" }}>
          <div
            style={{
              maxWidth: 720,
              width: "100%",
              margin: "0 auto",
              padding: "16px 24px",
            }}
          >
            {/* Hero image */}
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
                      onClick={() => {
                        if (merged?.heroImage?.asset?._ref) {
                          onShowHotspotCrop?.(
                            builder.image(merged.heroImage).width(1200).auto("format").url(),
                            {
                              hotspot: merged.heroImage.hotspot ?? DEFAULT_HOTSPOT,
                              crop: merged.heroImage.crop ?? DEFAULT_CROP,
                            },
                            ({ hotspot, crop }) => {
                              updateField("heroImage", {
                                ...merged.heroImage,
                                hotspot: { _type: "sanity.imageHotspot", ...hotspot },
                                crop: { _type: "sanity.imageCrop", ...crop },
                              });
                            },
                          );
                        }
                      }}
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

            {/* Metadata grid */}
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
                  日付
                </div>
                <TextInput
                  fontSize={0}
                  type="date"
                  value={merged.date ?? ""}
                  onChange={(e) => updateField("date", e.currentTarget.value || null)}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
                  固定表示
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={merged.pinned ?? false}
                    onChange={(e) => updateField("pinned", e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  上部に固定
                </label>
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

            {/* Body editor with language toggle */}
            <div ref={bodyContainerRef} style={{ minHeight: frozenHeight ?? undefined }}>
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
              onUpdate={handleUpdateDocument}
              onAddUrl={handleAddUrlDocument}
              onPickFile={handleFilePick}
              onOpenDocumentDetail={onOpenDocumentDetail}
            />
          </div>
        </div>
      )}

      {merged && <RawJsonButton getDocument={() => merged} />}
    </div>
  );
}

// ── Documents Section ───────────────────────────────────

function DocumentsSection({
  documents,
  onRemove,
  onUpdate,
  onAddUrl,
  onPickFile,
  onOpenDocumentDetail,
}: {
  documents: DocumentLinkItem[];
  onRemove: (key: string) => void;
  onUpdate: (key: string, updated: DocumentLinkItem) => void;
  onAddUrl: (label: string, url: string) => void;
  onPickFile: () => void;
  onOpenDocumentDetail?: (
    doc: DocumentLinkItem,
    onUpdate: (doc: DocumentLinkItem) => void,
    onRemove: () => void,
  ) => void;
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
      <div
        style={{
          fontSize: 12,
          color: "var(--card-muted-fg-color)",
          marginBottom: 8,
        }}
      >
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
              <button
                key={doc._key}
                type="button"
                onClick={() => {
                  onOpenDocumentDetail?.(
                    doc,
                    (updated) => {
                      onUpdate(doc._key, updated as DocumentLinkItem);
                    },
                    () => onRemove(doc._key),
                  );
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 10px",
                  borderRadius: 4,
                  border: "1px solid var(--card-border-color)",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--card-fg-color)",
                }}
              >
                <span style={{ fontSize: 14 }}>{doc.file ? "📎" : "🔗"}</span>
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
              </button>
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
