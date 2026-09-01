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
import { SlugInput } from "../shared/SlugInput";
import { useSlugUniqueness } from "../shared/useSlugUniqueness";
import {
  InternalPagePicker,
  internalPagePath,
  pageTocOptions,
  type InternalPageOption,
} from "./InternalPagePicker";
import {
  PublishConfirmation,
  ActionConfirmation,
  StudioErrorBanner,
  type PublishCheck,
} from "../shared/PublishingUI";
import {
  ANNOUNCEMENT_DESTINATION_DETAIL,
  ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE,
  announcementDestination,
  announcementSlugError,
  type AnnouncementDestination,
} from "../../../lib/announcement-fields";
import { recommendedSlugDefault } from "../../../lib/studio-slug";

// ── Types ────────────────────────────────────────────────

export interface AnnouncementDoc {
  _id: string;
  _rev?: string;
  _updatedAt?: string;
  title: { _key: string; value: string }[] | null;
  slug: { current: string } | null;
  date: string | null;
  pinned: boolean | null;
  destinationType?: AnnouncementDestination | null;
  targetPage?: { _type?: "reference"; _ref: string } | null;
  targetAnchor?: string | null;
  targetPageData?: InternalPageOption | null;
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
  _id, _rev, _updatedAt, title, slug, date, pinned, destinationType, targetPage, targetAnchor,
  "targetPageData": targetPage->{
    _id, title, description, images, slug,
    "categoryId": categoryRef->_id, "categoryTitle": categoryRef->label,
    sections
  },
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
  const [internalPages, setInternalPages] = useState<InternalPageOption[]>([]);
  const [internalPagesLoading, setInternalPagesLoading] = useState(true);
  const [internalPagesError, setInternalPagesError] = useState(false);
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
    const result = { ...doc, ...edits } as AnnouncementDoc;
    const selectedPage = internalPages.find((page) => page._id === result.targetPage?._ref);
    if (selectedPage) result.targetPageData = selectedPage;
    return result;
  }, [doc, edits, internalPages]);

  const detailPageSlug = merged?.slug?.current ?? "";
  const isDetailPage =
    announcementDestination(merged?.destinationType) !== ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE;
  const slugUniqueness = useSlugUniqueness({
    client,
    documentType: "announcement",
    documentId,
    slug: detailPageSlug,
    enabled: Boolean(merged) && isDetailPage && !announcementSlugError(merged?.slug),
  });

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

  useEffect(() => {
    setInternalPagesLoading(true);
    client
      .fetch<InternalPageOption[]>(
        `*[_type == "page" && !(_id in path("drafts.**"))] | order(title[_key == "ja"][0].value asc) {
          _id, title, description, images, slug,
          "categoryId": categoryRef->_id, "categoryTitle": categoryRef->label,
          sections
        }`,
      )
      .then((pages) => {
        setInternalPages(pages.filter((page) => page.slug && page.categoryId));
        setInternalPagesError(false);
      })
      .catch((error) => {
        console.error("Page options failed:", error);
        setInternalPagesError(true);
      })
      .finally(() => setInternalPagesLoading(false));
  }, [client]);

  // ── Auto-save ──────────────────────────────────────────

  const saveToSanity = useCallback(
    async (updates: Partial<AnnouncementDoc>) => {
      const baseDoc = draftDoc ?? publishedDoc;
      if (!baseDoc) return false;
      setSaving(true);
      setSaveStatus("saving");
      try {
        const { draftId } = documentPairIds(documentId);
        const { targetPageData: _targetPageData, ...baseForDraft } = baseDoc;
        await client.createIfNotExists(draftDocumentForBase(baseForDraft, draftId, "announcement"));
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

  function updateFields(updates: Partial<AnnouncementDoc>) {
    setEdits((prev) => ({ ...prev, ...updates }));
    setSaveStatus("dirty");

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveToSanity({ ...edits, ...updates });
    }, 1500);
  }

  function updateField(field: keyof AnnouncementDoc, value: unknown) {
    updateFields({ [field]: value });
  }

  // ── Publish ────────────────────────────────────────────

  const publishChecks = useMemo<PublishCheck[]>(() => {
    if (!merged) return [];
    const titleJa = i18nGet(merged.title, "ja").trim();
    const altJa = i18nGet(merged.heroImage?.alt, "ja").trim();
    const hasJapaneseBody = i18nGetBody(merged.body, "ja").length > 0;
    const destination = announcementDestination(merged.destinationType);
    const isInternalPage = destination === ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE;
    const slugValidationError = isInternalPage ? null : announcementSlugError(merged.slug);
    const slugUniquenessError =
      slugUniqueness.status === "collision"
        ? "この公開URLは別のお知らせで使用されています。"
        : slugUniqueness.status === "error"
          ? "公開URLの重複を確認できませんでした。"
          : slugUniqueness.status === "checking" || slugUniqueness.status === "idle"
            ? "公開URLの重複を確認しています。"
            : null;
    const targetTitle = i18nGet(merged.targetPageData?.title, "ja").trim();
    const tocOptions = pageTocOptions(merged.targetPageData);
    const targetToc = tocOptions.find((option) => option.id === merged.targetAnchor);
    const targetAnchorIsValid = !merged.targetAnchor || Boolean(targetToc);
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
      ...(isInternalPage
        ? [
            {
              label: "リンク先ページ",
              detail: targetTitle || "リンク先ページを選択してください。",
              tone: targetTitle ? ("ok" as const) : ("error" as const),
            },
            ...(targetTitle
              ? [
                  {
                    label: "ページ内の移動先",
                    detail: targetAnchorIsValid
                      ? targetToc?.title || "ページの先頭"
                      : "選択した目次項目が見つかりません。選び直してください。",
                    tone: targetAnchorIsValid ? ("ok" as const) : ("error" as const),
                  },
                ]
              : []),
          ]
        : [
            {
              label: "公開URL",
              detail:
                slugValidationError ??
                slugUniquenessError ??
                `/announcements/${merged.slug?.current}`,
              tone:
                slugValidationError || slugUniquenessError
                  ? ("error" as const)
                  : ("ok" as const),
            },
            {
              label: "日本語本文",
              detail: hasJapaneseBody ? "入力済み" : "未入力（短いお知らせでは省略できます）",
              tone: hasJapaneseBody ? ("ok" as const) : ("warning" as const),
            },
          ]),
      ...(!isInternalPage && merged.heroImage?.asset?._ref
        ? [
            {
              label: "画像の代替テキスト",
              detail: altJa || "未入力（読み上げ利用者向けの説明を推奨します）",
              tone: altJa ? ("ok" as const) : ("warning" as const),
            },
          ]
        : []),
    ];
  }, [merged, slugUniqueness.status]);

  function handleRequestPublish() {
    setPublishOpen(true);
  }

  async function handlePublish() {
    if (!merged) return;
    const { targetPageData: _targetPageData, ...source } = merged;
    try {
      setSaving(true);
      setSaveStatus("saving");
      if (
        announcementDestination(merged.destinationType) !== ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE
      ) {
        const slugError = announcementSlugError(merged.slug);
        if (slugError) {
          setSaveStatus("dirty");
          setErrorMessage(slugError);
          return;
        }
        const uniqueness = await slugUniqueness.checkNow();
        if (uniqueness !== "available") {
          setSaveStatus("dirty");
          setErrorMessage(
            uniqueness === "collision"
              ? "この公開URLは別のお知らせで使用されています。別の文字列に変更してください。"
              : "公開URLの重複を確認できませんでした。通信状況を確認して、もう一度お試しください。",
          );
          return;
        }
      }
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
        ...merged?.heroImage,
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
  const destinationType = announcementDestination(merged?.destinationType);
  const isInternalPageAnnouncement = destinationType === ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE;
  const slugValidationError = isInternalPageAnnouncement
    ? null
    : announcementSlugError(merged?.slug);
  const selectedInternalPage = internalPages.find((page) => page._id === merged?.targetPage?._ref);
  const selectedPageTocOptions = pageTocOptions(
    selectedInternalPage ?? merged?.targetPageData ?? null,
  );
  const selectedTocOption = selectedPageTocOptions.find(
    (option) => option.id === merged?.targetAnchor,
  );
  const selectedPageForPath = selectedInternalPage ?? merged?.targetPageData;
  const selectedInternalPagePath = selectedPageForPath
    ? `${internalPagePath(selectedPageForPath)}${merged?.targetAnchor ? `#${merged.targetAnchor}` : ""}`
    : "";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box padding={3} style={{ borderBottom: "1px solid var(--card-border-color)" }}>
        <Flex align="center" gap={3} style={{ flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 420px", minWidth: 0 }}>
            <div
              style={{
                color: "var(--card-muted-fg-color)",
                fontSize: fs.meta,
                lineHeight: "18px",
              }}
            >
              お知らせ
            </div>
            <h1
              title={i18nGet(merged?.title, "ja") || "（タイトルなし）"}
              style={{
                display: "block",
                margin: "4px 0 0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "var(--card-fg-color)",
                fontSize: fs.title,
                fontWeight: 600,
                lineHeight: "24px",
              }}
            >
              {i18nGet(merged?.title, "ja") || "（タイトルなし）"}
            </h1>
            <Flex align="center" gap={2} style={{ flexWrap: "wrap", marginTop: 8, minHeight: 20 }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: 10,
                  fontSize: fs.meta,
                  fontWeight: 600,
                  background: hasDraft ? "#9a5700" : "#2e7d32",
                  color: "#fff",
                }}
              >
                {hasDraft ? "下書き" : "公開済み"}
              </span>
              <span
                role="status"
                aria-live="polite"
                style={{
                  color: statusTone[saveStatus],
                  fontSize: fs.meta,
                  lineHeight: "18px",
                }}
              >
                {statusLabel[saveStatus]}
              </span>
              {draftDoc?._updatedAt && (
                <span
                  style={{
                    color: "var(--card-muted-fg-color)",
                    fontSize: fs.meta,
                    lineHeight: "18px",
                  }}
                >
                  {formatStudioRelativeTime(draftDoc._updatedAt)}
                </span>
              )}
            </Flex>
          </div>
          <Flex
            align="center"
            gap={2}
            role="group"
            aria-label="お知らせの操作"
            style={{ flex: "0 0 auto", marginLeft: "auto" }}
          >
            <Flex
              align="center"
              gap={1}
              style={{
                paddingRight: 8,
                borderRight: "1px solid var(--card-border-color)",
              }}
            >
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
                text="削除"
                mode="ghost"
                tone="critical"
                fontSize={0}
                padding={2}
                onClick={() => setConfirmAction("delete")}
                disabled={saving}
              />
            </Flex>
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
            <fieldset
              style={{
                margin: "0 0 20px",
                padding: 16,
                border: "1px solid var(--card-border-color)",
                borderRadius: 6,
              }}
            >
              <legend style={{ padding: "0 6px", fontSize: fs.label, fontWeight: 600 }}>
                お知らせをクリックしたときの移動先
              </legend>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 8,
                }}
              >
                {(
                  [
                    {
                      value: ANNOUNCEMENT_DESTINATION_DETAIL,
                      title: "お知らせの詳細ページ",
                      description: "本文・画像・添付資料を掲載する",
                    },
                    {
                      value: ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE,
                      title: "サイト内の既存ページ",
                      description: "本文は作らず、選んだページへ直接案内する",
                    },
                  ] as const
                ).map((option) => {
                  const checked = destinationType === option.value;
                  return (
                    <label
                      key={option.value}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: 12,
                        border: `2px solid ${checked ? "var(--card-focus-ring-color, #1e3a5f)" : "var(--card-border-color)"}`,
                        borderRadius: 6,
                        cursor: "pointer",
                        background: checked ? "rgba(30, 58, 95, 0.06)" : "transparent",
                      }}
                    >
                      <input
                        type="radio"
                        name={`announcement-destination-${merged._id}`}
                        value={option.value}
                        checked={checked}
                        onChange={() => updateField("destinationType", option.value)}
                        style={{ marginTop: 3 }}
                      />
                      <span>
                        <span style={{ display: "block", fontSize: fs.body, fontWeight: 600 }}>
                          {option.title}
                        </span>
                        <span
                          style={{
                            display: "block",
                            marginTop: 3,
                            color: "var(--card-muted-fg-color)",
                            fontSize: fs.meta,
                            lineHeight: 1.5,
                          }}
                        >
                          {option.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {isInternalPageAnnouncement ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 18,
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid var(--card-border-color)",
                  }}
                >
                  <InternalPagePicker
                    pages={internalPages}
                    selectedPage={selectedPageForPath}
                    loading={internalPagesLoading}
                    error={internalPagesError}
                    onSelect={(pageId) =>
                      updateFields({
                        targetPage: { _type: "reference", _ref: pageId },
                        targetAnchor: null,
                      })
                    }
                  />

                  {merged.targetPage?._ref ? (
                    <div>
                      <label
                        htmlFor={`announcement-target-anchor-${merged._id}`}
                        style={{
                          display: "block",
                          marginBottom: 6,
                          fontSize: fs.label,
                          fontWeight: 600,
                        }}
                      >
                        2. ページ内の移動先を選ぶ
                      </label>
                      <select
                        id={`announcement-target-anchor-${merged._id}`}
                        value={merged.targetAnchor ?? ""}
                        onChange={(event) =>
                          updateField("targetAnchor", event.currentTarget.value || null)
                        }
                        aria-invalid={Boolean(merged.targetAnchor && !selectedTocOption)}
                        aria-describedby={`announcement-target-anchor-help-${merged._id}`}
                        style={{
                          width: "100%",
                          minHeight: 36,
                          padding: "7px 10px",
                          border: `1px solid ${merged.targetAnchor && !selectedTocOption ? "#b42318" : "var(--card-border-color)"}`,
                          borderRadius: 4,
                          background: "var(--card-bg-color)",
                          color: "var(--card-fg-color)",
                          font: "inherit",
                        }}
                      >
                        <option value="">ページの先頭</option>
                        {merged.targetAnchor && !selectedTocOption ? (
                          <option value={merged.targetAnchor}>
                            選択中の項目は見つかりません（選び直してください）
                          </option>
                        ) : null}
                        {selectedPageTocOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.level === "subsection" ? "　↳ " : ""}
                            {option.title}
                          </option>
                        ))}
                      </select>
                      <div
                        id={`announcement-target-anchor-help-${merged._id}`}
                        role={merged.targetAnchor && !selectedTocOption ? "alert" : undefined}
                        style={{
                          marginTop: 6,
                          color:
                            merged.targetAnchor && !selectedTocOption
                              ? "#b42318"
                              : "var(--card-muted-fg-color)",
                          fontSize: fs.meta,
                          lineHeight: 1.5,
                        }}
                      >
                        {merged.targetAnchor && !selectedTocOption
                          ? "ページの見出しが変更または削除されています。移動先を選び直してください。"
                          : selectedPageTocOptions.length > 0
                            ? "ページの先頭、または目次にある見出しを選べます。"
                            : "このページには目次がないため、ページの先頭へ移動します。"}
                      </div>
                    </div>
                  ) : null}

                  {selectedInternalPagePath ? (
                    <div
                      style={{
                        padding: "8px 10px",
                        borderRadius: 4,
                        background: "var(--card-code-bg-color, rgba(0, 0, 0, 0.04))",
                        color: "var(--card-muted-fg-color)",
                        fontSize: fs.meta,
                        lineHeight: 1.5,
                        overflowWrap: "anywhere",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--card-fg-color)" }}>
                        実際の移動先
                      </span>
                      <br />
                      <code style={{ fontFamily: "ui-monospace, monospace" }}>
                        {selectedInternalPagePath}
                      </code>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </fieldset>

            {/* Hero image */}
            {!isInternalPageAnnouncement ? (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: fs.label,
                    color: "var(--card-muted-fg-color)",
                    marginBottom: 6,
                  }}
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
                        <OverlayButton
                          label="削除"
                          onClick={() => updateField("heroImage", null)}
                        />
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
            ) : null}

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
                タイトル（英語・任意／運用検討中）
              </div>
              <TextInput
                fontSize={1}
                value={i18nGet(merged.title, "en")}
                onChange={(e) =>
                  updateField("title", i18nSet(merged.title, "en", e.currentTarget.value))
                }
                onBlur={(event) => {
                  if (
                    announcementDestination(merged.destinationType) ===
                    ANNOUNCEMENT_DESTINATION_DETAIL
                  ) {
                    const defaultSlug = recommendedSlugDefault(
                      merged.slug,
                      event.currentTarget.value,
                    );
                    if (defaultSlug) {
                      updateField("slug", { _type: "slug", current: defaultSlug });
                    }
                  }
                }}
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
              {!isInternalPageAnnouncement ? (
                <SlugInput
                  id={`announcement-slug-${merged._id}`}
                  label="公開URL（末尾の文字）"
                  value={merged.slug?.current ?? ""}
                  publicUrlPrefix="https://yia.jp/announcements/"
                  formatError={slugValidationError}
                  uniquenessStatus={slugUniqueness.status}
                  onChange={(slug) => updateField("slug", { _type: "slug", current: slug })}
                  onRetry={() => void slugUniqueness.checkNow()}
                />
              ) : null}
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
              {!isInternalPageAnnouncement ? (
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
              ) : null}
            </div>

            {/* Body editor with language toggle */}
            {!isInternalPageAnnouncement ? (
              <div ref={bodyContainerRef} style={{ minHeight: frozenHeight ?? undefined }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    paddingBottom: 6,
                  }}
                >
                  <div style={{ fontSize: fs.label, color: "var(--card-muted-fg-color)" }}>
                    本文
                  </div>
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
                  onChange={(value) =>
                    updateField("body", i18nSetBody(merged.body, bodyLang, value))
                  }
                  onOpenImagePicker={onOpenImagePicker}
                  onOpenGalleryEditor={onOpenGalleryEditor}
                  activeGalleryBlockKey={activeGalleryBlockKey}
                  onDeselectGallery={onDeselectGallery}
                />
              </div>
            ) : null}

            {/* Documents section */}
            {!isInternalPageAnnouncement ? (
              <DocumentsSection
                documents={merged.documents ?? []}
                onRemove={handleRemoveDocument}
                onUpdate={handleUpdateDocument}
                onAddUrl={handleAddUrlDocument}
                onPickFile={handleFilePick}
                onOpenDocumentDetail={onOpenDocumentDetail}
              />
            ) : null}
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
