"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text, TextInput } from "@sanity/ui";
import { PublishIcon, RevertIcon } from "@sanity/icons";
import createImageUrlBuilder from "@sanity/image-url";
import { i18nGet, i18nSet } from "../shared/i18n";
import { LoadingDots } from "../shared/ui";
import { RawJsonButton } from "../shared/RawJsonViewer";
import type { GalleryImageItem } from "../blog/GalleryPanel";
import { SectionBar } from "./SectionBar";
import { SectionEditor } from "./SectionEditor";
import type { PageDoc, SectionItem, SectionTypeName } from "./types";

// ── Constants ────────────────────────────────────────────

const DOC_PROJECTION = `{
  _id, _rev, _updatedAt,
  title, subtitle, description, slug, template,
  "categoryRef": categoryRef,
  images,
  sections[] {
    _key, _type, title, hideTitle,
    ...
  }
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

// ── PageEditor ───────────────────────────────────────────

export function PageEditor({
  documentId,
  onOpenImagePicker,
  onOpenSectionPicker,
  onOpenGalleryEditor,
  activeGallerySectionKey,
  onDeselectGallery,
  onSave,
  onMergedChange,
  onDraftChange,
  onOpenFilePicker,
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
  onOpenFilePicker?: (onSelect: (assetId: string, filename: string, ext: string) => void) => void;
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

  const doc = draftDoc ?? publishedDoc;
  const hasDraft = draftDoc !== null;

  const [edits, setEdits] = useState<Partial<PageDoc>>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ── Load document ──────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    const pubId = documentId.replace(/^drafts\./, "");
    const draftId = `drafts.${pubId}`;

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
      if (!baseDoc) return;
      setSaving(true);
      setSaveStatus("saving");
      try {
        const pubId = documentId.replace(/^drafts\./, "");
        const draftId = `drafts.${pubId}`;
        await client.createIfNotExists({
          ...baseDoc,
          _id: draftId,
          _type: "page",
        });
        await client.patch(draftId).set(updates).commit();
        const updated = await client.fetch<PageDoc | null>(`*[_id == $id][0] ${DOC_PROJECTION}`, {
          id: draftId,
        });
        if (updated) setDraftDoc(updated);
        setSaveStatus("saved");
        onSave?.();
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
    if (!confirm("このセクションを削除しますか？")) return;
    const sections = [...(merged?.sections ?? [])];
    sections.splice(index, 1);
    updateField("sections", sections);
    if (expandedSection === merged?.sections?.[index]?._key) {
      setExpandedSection(null);
    }
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

  async function handlePublish() {
    if (!merged) return;
    try {
      setSaving(true);
      setSaveStatus("saving");
      const pubId = documentId.replace(/^drafts\./, "");
      const draftId = `drafts.${pubId}`;

      const draft = await client.fetch<PageDoc | null>(`*[_id == $draftId][0] ${DOC_PROJECTION}`, {
        draftId,
      });
      const source = draft ?? merged;

      const { _rev, _updatedAt, ...rest } = source;
      await client.createOrReplace({
        ...rest,
        _id: pubId,
        _type: "page",
      });

      await client.delete(draftId).catch(() => {});

      const newPub = await client.fetch<PageDoc | null>(`*[_id == $id][0] ${DOC_PROJECTION}`, {
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
      const freshPub = await client.fetch<PageDoc | null>(`*[_id == $id][0] ${DOC_PROJECTION}`, {
        id: pubId,
      });
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

  // ── Hero image ─────────────────────────────────────────

  function handleHeroImagePick() {
    onOpenImagePicker((assetId: string) => {
      const images = merged?.images ?? [];
      const newImage = {
        _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        _type: "imageFile" as const,
        file: { _type: "image", asset: { _type: "reference", _ref: assetId } },
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
              padding: "16px 24px 200px",
            }}
          >
            {/* Hero image */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
                ヒーロー画像
              </div>
              {merged.images?.[0]?.file?.asset?._ref ? (
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
                      onClick={() => updateField("images", (merged.images ?? []).slice(1))}
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
            <div style={{ marginBottom: 16 }}>
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

            {/* Subtitle */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
                サブタイトル（日本語）
              </div>
              <TextInput
                fontSize={1}
                value={i18nGet(merged.subtitle, "ja")}
                onChange={(e) =>
                  updateField("subtitle", i18nSet(merged.subtitle, "ja", e.currentTarget.value))
                }
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
                サブタイトル（English）
              </div>
              <TextInput
                fontSize={1}
                value={i18nGet(merged.subtitle, "en")}
                onChange={(e) =>
                  updateField("subtitle", i18nSet(merged.subtitle, "en", e.currentTarget.value))
                }
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
                説明（日本語）
              </div>
              <textarea
                rows={3}
                value={i18nGet(merged.description, "ja")}
                onChange={(e) =>
                  updateField("description", i18nSet(merged.description, "ja", e.target.value))
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
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "var(--card-muted-fg-color)", marginBottom: 6 }}>
                説明（English）
              </div>
              <textarea
                rows={3}
                value={i18nGet(merged.description, "en")}
                onChange={(e) =>
                  updateField("description", i18nSet(merged.description, "en", e.target.value))
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

            {/* Sections */}
            <div
              style={{
                borderTop: "1px solid var(--card-border-color)",
                paddingTop: 16,
              }}
            >
              <div
                style={{
                  fontSize: 12,
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
                  const isActive = isGallery
                    ? activeGallerySectionKey === section._key
                    : expandedSection === section._key;

                  function handleToggle() {
                    if (isGallery && onOpenGalleryEditor) {
                      if (activeGallerySectionKey === section._key) {
                        onDeselectGallery?.();
                      } else {
                        onOpenGalleryEditor(
                          section._key,
                          (section.images as GalleryImageItem[]) ?? [],
                          (images) => updateSection(index, "images", images),
                        );
                      }
                    } else {
                      setExpandedSection(expandedSection === section._key ? null : section._key);
                    }
                  }

                  return (
                    <div key={section._key}>
                      <SectionBar
                        section={section}
                        index={index}
                        totalCount={merged.sections?.length ?? 0}
                        isExpanded={isActive}
                        onToggle={handleToggle}
                        onMoveUp={() => moveSection(index, -1)}
                        onMoveDown={() => moveSection(index, 1)}
                        onRemove={() => removeSection(index)}
                      />
                      {expandedSection === section._key && !isGallery && (
                        <SectionEditor
                          section={section}
                          onUpdateField={(field, value) => updateSection(index, field, value)}
                          onOpenImagePicker={onOpenImagePicker}
                          onOpenFilePicker={onOpenFilePicker}
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
                    fontSize: 13,
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
    </div>
  );
}
