"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text, TextInput } from "@sanity/ui";
import { PublishIcon, RevertIcon } from "@sanity/icons";
import createImageUrlBuilder from "@sanity/image-url";
import { i18nGet, i18nSet } from "../shared/i18n";
import { AutoTextarea } from "../shared/BilingualTextarea";
import { LoadingDots } from "../shared/ui";
import { RawJsonButton } from "../shared/RawJsonViewer";
import type { GalleryImageItem } from "../blog/GalleryPanel";
import type { DocumentLinkItem as SharedDocumentLinkItem } from "../shared/document-link-types";
import { OverlayButton, ImageOverlayActions } from "../homepage/HeroSection";
import { SectionBar } from "../pages/SectionBar";
import { useFocusContext } from "../shared/FocusContext";
import { SectionEditor } from "../pages/SectionEditor";
import type { PageDoc, SectionItem, SectionTypeName } from "../pages/types";
import { sectionDefaults } from "../pages/sectionDefaults";
import {
  documentPairIds,
  draftDocumentForBase,
  publishedDocumentForDraft,
} from "../shared/draft-documents";
import { formatStudioRelativeTime } from "../shared/date-format";
import { fs } from "@/sanity/lib/studioTokens";
import { BilingualInput } from "../shared/BilingualInput";
import {
  PublishConfirmation,
  ActionConfirmation,
  StudioErrorBanner,
  type PublishCheck,
} from "../shared/PublishingUI";

// ── Constants ────────────────────────────────────────────

const DOC_PROJECTION = `{
  _id, _rev, _updatedAt,
  title, description, slug, template,
  "categoryRef": categoryRef,
  images,
  sections[] {
    _key, _type, title,
    ...
  }
}`;

// ── PageEditor ───────────────────────────────────────────

export function PageEditor({
  documentId,
  onOpenImagePicker,
  onOpenSectionPicker,
  onOpenGalleryEditor,
  activeGallerySectionKey,
  onDeselectGallery,
  onOpenTableEditor,
  activeTableSectionKey,
  onDeselectTable,
  onSave,
  onMergedChange,
  onDraftChange,
  onOpenFilePicker,
  onOpenDocumentDetail,
  onCloseRightPanel,
}: {
  documentId: string;
  onOpenImagePicker: (onSelect: (assetId: string) => void) => void;
  onOpenSectionPicker?: (onSelect: (type: SectionTypeName) => void) => void;
  onOpenGalleryEditor?: (
    sectionKey: string,
    images: GalleryImageItem[],
    onUpdate: (images: GalleryImageItem[]) => void,
  ) => void;
  activeGallerySectionKey?: string | null;
  onDeselectGallery?: () => void;
  onOpenTableEditor?: (
    sectionKey: string,
    section: SectionItem,
    onUpdateField: (field: string, value: unknown) => void,
  ) => void;
  activeTableSectionKey?: string | null;
  onDeselectTable?: () => void;
  onOpenFilePicker?: (onSelect: (assetId: string, filename: string, ext: string) => void) => void;
  onOpenDocumentDetail?: (
    doc: SharedDocumentLinkItem,
    onUpdate: (doc: SharedDocumentLinkItem) => void,
    onRemove: () => void,
  ) => void;
  onCloseRightPanel?: () => void;
  onSave?: () => void;
  onMergedChange?: (doc: PageDoc | null) => void;
  onDraftChange?: () => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = createImageUrlBuilder(client);

  const [publishedDoc, setPublishedDoc] = useState<PageDoc | null>(null);
  const [draftDoc, setDraftDoc] = useState<PageDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "dirty" | "saving" | "discarding" | "error"
  >("saved");
  const [publishOpen, setPublishOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    { type: "discard" } | { type: "removeSection"; index: number } | null
  >(null);

  const doc = draftDoc ?? publishedDoc;
  const hasDraft = draftDoc !== null;

  const [edits, setEdits] = useState<Partial<PageDoc>>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  const merged = useMemo(() => {
    if (!doc) return null;
    return { ...doc, ...edits } as PageDoc;
  }, [doc, edits]);

  // Notify parent of merged doc changes for preview
  useEffect(() => {
    onMergedChange?.(merged);
  }, [merged, onMergedChange]);

  // Section accordion state
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { setFocus, clearFocus } = useFocusContext();

  // ── Load document ──────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    const { publishedId: pubId, draftId } = documentPairIds(documentId);

    Promise.all([
      client.fetch<PageDoc | null>(`*[_id == $id][0] ${DOC_PROJECTION}`, { id: pubId }),
      client.fetch<PageDoc | null>(`*[_id == $id][0] ${DOC_PROJECTION}`, { id: draftId }),
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
    async (updates: Partial<PageDoc>) => {
      const baseDoc = draftDoc ?? publishedDoc;
      if (!baseDoc) return false;
      setSaving(true);
      setSaveStatus("saving");
      try {
        const { draftId } = documentPairIds(documentId);
        await client.createIfNotExists(draftDocumentForBase(baseDoc, draftId, "page"));
        await client.patch(draftId).set(updates).commit();
        const updated = await client.fetch<PageDoc | null>(`*[_id == $id][0] ${DOC_PROJECTION}`, {
          id: draftId,
        });
        if (updated) setDraftDoc(updated);
        setSaveStatus("saved");
        setErrorMessage(null);
        onSave?.();
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

  // ── Section helpers ────────────────────────────────────

  function updateSection(index: number, field: string, value: unknown) {
    const sections = [...(merged?.sections ?? [])];
    sections[index] = { ...sections[index], [field]: value };
    updateField("sections", sections);
  }

  function moveSection(index: number, direction: -1 | 1) {
    const sections = [...(merged?.sections ?? [])];
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    updateField("sections", sections);
  }

  function removeSection(index: number) {
    setConfirmAction({ type: "removeSection", index });
  }

  function executeRemoveSection(index: number) {
    const sections = [...(merged?.sections ?? [])];
    sections.splice(index, 1);
    updateField("sections", sections);
    if (expandedSection === merged?.sections?.[index]?._key) {
      setExpandedSection(null);
    }
    setConfirmAction(null);
  }

  function addSection(type: SectionTypeName) {
    const sections = [...(merged?.sections ?? [])];
    const newSection: SectionItem = {
      _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
      _type: type,
      title: [
        { _key: "ja", value: "" },
        { _key: "en", value: "" },
      ],
      ...(sectionDefaults[type] ?? {}),
    };
    sections.push(newSection);
    updateField("sections", sections);

    // Auto-open the gallery editor for new gallery sections
    if (type === "gallery" && onOpenGalleryEditor) {
      const newIndex = sections.length - 1;
      onOpenGalleryEditor(newSection._key, [], (images) =>
        updateSection(newIndex, "images", images),
      );
    } else {
      setExpandedSection(newSection._key);
    }
  }

  // ── Publish ────────────────────────────────────────────

  const publishChecks = useMemo<PublishCheck[]>(() => {
    if (!merged) return [];
    const titleJa = i18nGet(merged.title, "ja").trim();
    const altJa = i18nGet(merged.images?.[0]?.alt, "ja").trim();
    return [
      {
        label: "日本語タイトル",
        detail: titleJa || "日本語タイトルを入力してください。",
        tone: titleJa ? "ok" : "error",
      },
      {
        label: "公開URL",
        detail: merged.slug?.trim() || "公開URLが設定されていません。",
        tone: merged.slug?.trim() ? "ok" : "error",
      },
      ...(merged.images?.[0]?.file?.asset?._ref
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

      await client.createOrReplace(publishedDocumentForDraft(source, pubId, "page"));

      await client.delete(draftId).catch(() => {});

      const newPub = await client.fetch<PageDoc | null>(`*[_id == $id][0] ${DOC_PROJECTION}`, {
        id: pubId,
      });
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
      const freshPub = await client.fetch<PageDoc | null>(`*[_id == $id][0] ${DOC_PROJECTION}`, {
        id: pubId,
      });
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

  // ── Hero image ─────────────────────────────────────────

  function handleHeroImagePick() {
    onOpenImagePicker((assetId: string) => {
      const images = merged?.images ?? [];
      const previousImage = images[0];
      const newImage = {
        ...previousImage,
        _key: previousImage?._key ?? crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        _type: "imageFile" as const,
        file: {
          ...previousImage?.file,
          _type: "image",
          asset: { _type: "reference", _ref: assetId },
        },
        alt: previousImage?.alt ?? [
          { _key: "ja", value: "" },
          { _key: "en", value: "" },
        ],
      };
      updateField("images", [newImage, ...images.slice(1)]);
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
                onClick={() => setConfirmAction({ type: "discard" })}
                disabled={saving}
              />
            )}
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
              padding: "16px 24px 200px",
            }}
          >
            {/* Hero image */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{ fontSize: fs.label, color: "var(--card-muted-fg-color)", marginBottom: 6 }}
              >
                ヒーロー画像
              </div>
              {merged.images?.[0]?.file?.asset?._ref ? (
                <ImageOverlayActions
                  buttons={
                    <>
                      <OverlayButton label="変更" onClick={handleHeroImagePick} />
                      <OverlayButton
                        label="削除"
                        onClick={() => updateField("images", (merged.images ?? []).slice(1))}
                      />
                    </>
                  }
                >
                  <div style={{ borderRadius: 6, overflow: "hidden", lineHeight: 0 }}>
                    <img
                      src={builder
                        .image(merged.images[0].file)
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
              {merged.images?.[0]?.file?.asset?._ref ? (
                <div style={{ marginTop: 10 }}>
                  <BilingualInput
                    label="画像の代替テキスト（推奨）"
                    value={merged.images[0].alt}
                    onChange={(alt) => {
                      const images = [...(merged.images ?? [])];
                      images[0] = { ...images[0], alt };
                      updateField("images", images);
                    }}
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
            <div style={{ marginBottom: 16 }}>
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

            {/* Description */}
            {(["ja", "en"] as const).map((lang) => (
              <div key={lang} style={{ marginBottom: lang === "ja" ? 16 : 20 }}>
                <div
                  style={{
                    fontSize: fs.label,
                    color: "var(--card-muted-fg-color)",
                    marginBottom: 6,
                  }}
                >
                  {lang === "ja" ? "説明（日本語）" : "説明（英語）"}
                </div>
                <AutoTextarea
                  value={i18nGet(merged.description, lang)}
                  onChange={(v) => updateField("description", i18nSet(merged.description, lang, v))}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    border: "1px solid var(--card-border-color)",
                    borderRadius: 4,
                    fontSize: fs.body,
                    fontFamily: "inherit",
                    background: "transparent",
                    color: "inherit",
                  }}
                />
              </div>
            ))}

            {/* Sections */}
            <div
              style={{
                borderTop: "1px solid var(--card-border-color)",
                paddingTop: 16,
              }}
            >
              <div
                style={{
                  fontSize: fs.label,
                  color: "var(--card-muted-fg-color)",
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                セクション（{merged.sections?.length ?? 0}）
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(merged.sections ?? []).map((section, index) => {
                  const isGallery = section._type === "gallery";
                  const isTable = section._type === "table";
                  const isActive = isGallery
                    ? activeGallerySectionKey === section._key
                    : isTable
                      ? activeTableSectionKey === section._key
                      : expandedSection === section._key;

                  function handleToggle() {
                    if (isGallery && onOpenGalleryEditor) {
                      if (activeGallerySectionKey === section._key) {
                        onDeselectGallery?.();
                      } else {
                        setExpandedSection(null);
                        onOpenGalleryEditor(
                          section._key,
                          (section.images as GalleryImageItem[]) ?? [],
                          (images) => updateSection(index, "images", images),
                        );
                      }
                    } else if (isTable && onOpenTableEditor) {
                      if (activeTableSectionKey === section._key) {
                        onDeselectTable?.();
                      } else {
                        setExpandedSection(null);
                        onOpenTableEditor(section._key, section, (field, value) =>
                          updateSection(index, field, value),
                        );
                      }
                    } else {
                      onCloseRightPanel?.();
                      const next = expandedSection === section._key ? null : section._key;
                      setExpandedSection(next);
                      if (next !== null) setFocus(next);
                      else clearFocus();
                    }
                  }

                  return (
                    <div key={section._key}>
                      <SectionBar
                        section={section}
                        index={index}
                        totalCount={merged.sections?.length ?? 0}
                        isExpanded={isActive}
                        editingInPanel={(isGallery || isTable) && isActive}
                        onToggle={handleToggle}
                        onMoveUp={() => moveSection(index, -1)}
                        onMoveDown={() => moveSection(index, 1)}
                        onRemove={() => removeSection(index)}
                      />
                      {expandedSection === section._key && !isGallery && !isTable && (
                        <SectionEditor
                          section={section}
                          onUpdateField={(field, value) => updateSection(index, field, value)}
                          onOpenImagePicker={onOpenImagePicker}
                          onOpenFilePicker={onOpenFilePicker}
                          onOpenDocumentDetail={onOpenDocumentDetail}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add section button */}
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => onOpenSectionPicker?.(addSection)}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    border: "1px dashed var(--card-border-color)",
                    borderRadius: 6,
                    background: "transparent",
                    color: "var(--card-muted-fg-color)",
                    fontSize: fs.body,
                    cursor: "pointer",
                  }}
                >
                  + セクションを追加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {merged && <RawJsonButton getDocument={() => merged} />}
      {publishOpen ? (
        <PublishConfirmation
          title="ページを公開しますか？"
          description="保存中の変更を反映してから、このページを公開します。"
          checks={publishChecks}
          busy={saving}
          onConfirm={handlePublish}
          onClose={() => setPublishOpen(false)}
        />
      ) : null}
      {confirmAction?.type === "discard" ? (
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
      {confirmAction?.type === "removeSection" ? (
        <ActionConfirmation
          title="このセクションを削除しますか？"
          description="セクション内の入力内容も削除されます。削除後、ページを公開するまでは公開中のページには影響しません。"
          confirmLabel="セクションを削除"
          busy={saving}
          onConfirm={() => executeRemoveSection(confirmAction.index)}
          onClose={() => setConfirmAction(null)}
        />
      ) : null}
    </div>
  );
}
