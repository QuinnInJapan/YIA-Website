"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text, TextInput } from "@sanity/ui";
import { PublishIcon, TrashIcon, RevertIcon } from "@sanity/icons";
import createImageUrlBuilder from "@sanity/image-url";
import type { PortableTextBlock } from "@portabletext/editor";
import { DEFAULT_HOTSPOT, DEFAULT_CROP } from "../shared/HotspotCropTool";
import { OverlayButton, ImageOverlayActions } from "../homepage/HeroSection";
import { i18nGet, i18nSet, i18nGetBody, i18nSetBody } from "../shared/i18n";
import type { DocumentLinkItem } from "../shared/document-link-types";
import { LoadingDots } from "../shared/ui";
import { RawJsonButton } from "../shared/RawJsonViewer";
import {
  documentPairIds,
  draftDocumentForBase,
  publishedDocumentForDraft,
} from "../shared/draft-documents";
import { formatStudioRelativeTime } from "../shared/date-format";
import { BodyEditor } from "../blog/PteEditor";
import type { GalleryImageItem } from "../blog/GalleryPanel";
import { fs } from "@/sanity/lib/studioTokens";
import { BilingualInput } from "../shared/BilingualInput";
import {
  PublishConfirmation,
  ActionConfirmation,
  StudioErrorBanner,
  type PublishCheck,
} from "../shared/PublishingUI";

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

// ── Constants ────────────────────────────────────────────

export const DOC_PROJECTION = `{
  _id, _rev, _updatedAt, title, slug, date, pinned,
  heroImage, excerpt, body, documents
}`;

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
  const [publishOpen, setPublishOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"discard" | "delete" | null>(null);
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

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

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
    const { publishedId: pubId, draftId } = documentPairIds(documentId);

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
      if (!baseDoc) return false;
      setSaving(true);
      setSaveStatus("saving");
      try {
        const { draftId } = documentPairIds(documentId);
        await client.createIfNotExists(draftDocumentForBase(baseDoc, draftId, "announcement"));
        await client.patch(draftId).set(updates).commit();
        const updated = await client.fetch<AnnouncementDoc | null>(
          `*[_id == $id][0] ${DOC_PROJECTION}`,
          { id: draftId },
        );
        if (updated) setDraftDoc(updated);
        setSaveStatus("saved");
        setErrorMessage(null);
        return true;
      } catch (err) {
        console.error("Save failed:", err);
        setSaveStatus("error");
        setErrorMessage("変更を保存できませんでした。通信状況を確認して、もう一度お試しください。");
        return false;
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

  const publishChecks = useMemo<PublishCheck[]>(() => {
    if (!merged) return [];
    const titleJa = i18nGet(merged.title, "ja").trim();
    const altJa = i18nGet(merged.heroImage?.alt, "ja").trim();
    const hasJapaneseBody = i18nGetBody(merged.body, "ja").length > 0;
    return [
      {
        label: "日本語タイトル",
        detail: titleJa || "日本語タイトルを入力してください。",
        tone: titleJa ? "ok" : "error",
      },
      {
        label: "掲載日",
        detail: merged.date || "掲載日を入力してください。",
        tone: merged.date ? "ok" : "error",
      },
      {
        label: "日本語本文",
        detail: hasJapaneseBody ? "入力済み" : "未入力（短いお知らせでは省略できます）",
        tone: hasJapaneseBody ? "ok" : "warning",
      },
      ...(merged.heroImage?.asset?._ref
        ? [
            {
              label: "画像の代替テキスト",
              detail: altJa || "未入力（読み上げ利用者向けの説明を推奨します）",
              tone: altJa ? ("ok" as const) : ("warning" as const),
            },
          ]
        : []),
    ];
  }, [merged]);

  function handleRequestPublish() {
    setPublishOpen(true);
  }

  async function handlePublish() {
    if (!merged) return;
    const source = merged;
    try {
      setSaving(true);
      setSaveStatus("saving");
      const { publishedId: pubId, draftId } = documentPairIds(documentId);

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (Object.keys(edits).length > 0) {
        const saved = await saveToSanity(edits);
        if (!saved) return;
      }

      await client.createOrReplace(publishedDocumentForDraft(source, pubId, "announcement"));

      await client.delete(draftId).catch(() => {});

      const newPub = await client.fetch<AnnouncementDoc | null>(
        `*[_id == $id][0] ${DOC_PROJECTION}`,
        { id: pubId },
      );
      setPublishedDoc(newPub);
      setDraftDoc(null);
      setEdits({});
      setSaveStatus("saved");
      setErrorMessage(null);
      setPublishOpen(false);
      onDraftChange?.();
    } catch (err) {
      console.error("Publish failed:", err);
      setSaveStatus("error");
      setErrorMessage(
        "公開できませんでした。下書きは残っています。通信状況を確認して、もう一度お試しください。",
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Discard draft ──────────────────────────────────────

  async function handleDiscardDraft() {
    setSaving(true);
    setSaveStatus("discarding");
    const { publishedId: pubId, draftId } = documentPairIds(documentId);
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
      setConfirmAction(null);
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
    const { publishedId: pubId, draftId } = documentPairIds(documentId);
    try {
      await client.delete(draftId).catch(() => {});
      await client.delete(pubId).catch(() => {});
      setConfirmAction(null);
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
                fontSize: fs.meta,
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
                {formatStudioRelativeTime(draftDoc._updatedAt)}
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
                onClick={() => setConfirmAction("discard")}
                disabled={saving}
              />
            )}
            <Button
              icon={TrashIcon}
              aria-label="このお知らせを削除"
              mode="ghost"
              tone="critical"
              fontSize={0}
              padding={2}
              onClick={() => setConfirmAction("delete")}
              disabled={saving}
            />
            <Button
              icon={PublishIcon}
              text="公開"
              tone="positive"
              fontSize={1}
              padding={2}
              onClick={handleRequestPublish}
              disabled={saving || !hasDraft}
            />
          </Flex>
        </Flex>
      </Box>

      {errorMessage ? (
        <StudioErrorBanner
          message={errorMessage}
          actionLabel="再試行"
          onAction={() => saveToSanity(edits)}
          onDismiss={() => setErrorMessage(null)}
        />
      ) : null}

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
              <div
                style={{ fontSize: fs.label, color: "var(--card-muted-fg-color)", marginBottom: 6 }}
              >
                ヒーロー画像
              </div>
              {merged.heroImage?.asset?._ref ? (
                <ImageOverlayActions
                  buttons={
                    <>
                      <OverlayButton label="変更" onClick={handleHeroImagePick} />
                      <OverlayButton
                        label="切り抜き"
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
                      />
                      <OverlayButton label="削除" onClick={() => updateField("heroImage", null)} />
                    </>
                  }
                >
                  <div style={{ borderRadius: 6, overflow: "hidden", lineHeight: 0 }}>
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
                  </div>
                </ImageOverlayActions>
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
                    fontSize: fs.body,
                    cursor: "pointer",
                  }}
                >
                  + 画像を追加
                </button>
              )}
              {merged.heroImage?.asset?._ref ? (
                <div style={{ marginTop: 10 }}>
                  <BilingualInput
                    label="画像の代替テキスト（推奨）"
                    value={merged.heroImage.alt}
                    onChange={(alt) => updateField("heroImage", { ...merged.heroImage, alt })}
                  />
                </div>
              ) : null}
            </div>

            {/* Title fields */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{ fontSize: fs.label, color: "var(--card-muted-fg-color)", marginBottom: 6 }}
              >
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
              <div
                style={{ fontSize: fs.label, color: "var(--card-muted-fg-color)", marginBottom: 6 }}
              >
                タイトル（英語）
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
                <div
                  style={{
                    fontSize: fs.label,
                    color: "var(--card-muted-fg-color)",
                    marginBottom: 6,
                  }}
                >
                  公開URL
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
                <div
                  style={{
                    fontSize: fs.label,
                    color: "var(--card-muted-fg-color)",
                    marginBottom: 6,
                  }}
                >
                  掲載日
                </div>
                <TextInput
                  fontSize={0}
                  type="date"
                  value={merged.date ?? ""}
                  onChange={(e) => updateField("date", e.currentTarget.value || null)}
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: fs.label,
                    color: "var(--card-muted-fg-color)",
                    marginBottom: 6,
                  }}
                >
                  固定表示
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    fontSize: fs.body,
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
                <div
                  style={{
                    fontSize: fs.label,
                    color: "var(--card-muted-fg-color)",
                    marginBottom: 6,
                  }}
                >
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
                    fontSize: fs.body,
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
                <div style={{ fontSize: fs.label, color: "var(--card-muted-fg-color)" }}>本文</div>
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
                        fontSize: fs.meta,
                        lineHeight: "18px",
                        fontWeight: bodyLang === l ? 600 : 400,
                        background: bodyLang === l ? "var(--card-fg-color)" : "transparent",
                        color:
                          bodyLang === l ? "var(--card-bg-color)" : "var(--card-muted-fg-color)",
                      }}
                    >
                      {l === "ja" ? "日本語" : "英語"}
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
      {publishOpen ? (
        <PublishConfirmation
          title="お知らせを公開しますか？"
          description="保存中の変更を反映してから、このお知らせを公開します。"
          checks={publishChecks}
          busy={saving}
          onConfirm={handlePublish}
          onClose={() => setPublishOpen(false)}
        />
      ) : null}
      {confirmAction === "discard" ? (
        <ActionConfirmation
          title="下書きを破棄しますか？"
          description="未公開の変更を削除し、現在公開されている内容に戻します。この操作は元に戻せません。"
          confirmLabel="下書きを破棄"
          tone="caution"
          busy={saving}
          onConfirm={handleDiscardDraft}
          onClose={() => setConfirmAction(null)}
        />
      ) : null}
      {confirmAction === "delete" ? (
        <ActionConfirmation
          title="このお知らせを削除しますか？"
          description="公開版と下書きを完全に削除します。この操作は元に戻せません。"
          confirmLabel="お知らせを削除"
          busy={saving}
          onConfirm={handleDelete}
          onClose={() => setConfirmAction(null)}
        />
      ) : null}
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
          fontSize: fs.label,
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
                  fontSize: fs.body,
                  color: "var(--card-fg-color)",
                }}
              >
                <span style={{ fontSize: fs.body }}>{doc.file ? "📎" : "🔗"}</span>
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
                    <div style={{ fontSize: fs.meta, color: "var(--card-muted-fg-color)" }}>
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
