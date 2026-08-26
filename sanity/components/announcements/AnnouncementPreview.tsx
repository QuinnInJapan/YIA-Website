"use client";

import { ja, en } from "@/lib/i18n";
import { formatDateDot } from "@/lib/date-format";
import { fileUrl } from "@/lib/sanity/image";
import BilingualPortableText from "@/components/BilingualPortableText";
import DocList from "@/components/DocList";
import type { AnnouncementDoc } from "./AnnouncementEditor";
import type { I18nBlocks } from "@/lib/i18n";
import type { Document } from "@/lib/types";
import { fs } from "@/sanity/lib/studioTokens";
import { PagePreview } from "../pages/PagePreview";
import type { PageDoc } from "../pages/types";
import { pageTocOptions } from "./InternalPagePicker";
import {
  ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE,
  announcementDestination,
} from "@/lib/announcement-fields";

/** Resolve file URLs client-side (mirrors server-side resolveDocs) */
function resolveDocsClient(docs: AnnouncementDoc["documents"]): Document[] {
  if (!docs?.length) return [];
  return docs.map((doc) => {
    const resolved = doc.file ? fileUrl(doc.file as any) : "";
    return {
      ...doc,
      url: resolved || doc.url || "",
    } as unknown as Document;
  });
}

export function AnnouncementPreview({ doc }: { doc: AnnouncementDoc }) {
  const dateStr = doc.date ? formatDateDot(doc.date) : "";
  const bodyField = doc.body as I18nBlocks | undefined;
  const resolvedDocs = resolveDocsClient(doc.documents);
  const isInternalPage =
    announcementDestination(doc.destinationType) === ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE;
  const targetTitle = ja(doc.targetPageData?.title ?? undefined);
  const targetPath =
    doc.targetPageData?.categoryId && doc.targetPageData?.slug
      ? `/${doc.targetPageData.categoryId.replace(/^category-/, "")}/${doc.targetPageData.slug}${doc.targetAnchor ? `#${doc.targetAnchor}` : ""}`
      : "";

  if (isInternalPage) {
    const targetPage = doc.targetPageData;
    const targetSection = pageTocOptions(targetPage).find(
      (option) => option.id === doc.targetAnchor,
    );

    if (!targetPage?._id) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: 24,
            background: "#fff",
            color: "#52606d",
            textAlign: "center",
          }}
        >
          リンク先ページを選ぶと、ここに実際のページが表示されます。
        </div>
      );
    }

    const previewPage: PageDoc = {
      _id: targetPage._id,
      title: targetPage.title,
      description: targetPage.description ?? null,
      slug: targetPage.slug,
      template: null,
      categoryRef: targetPage.categoryId ? { _ref: targetPage.categoryId } : null,
      images: targetPage.images ?? null,
      sections: (targetPage.sections as PageDoc["sections"]) ?? null,
    };

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
          background: "#fff",
          color: "#333",
          fontFamily: "var(--font-body)",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            padding: "10px 12px",
            borderBottom: "1px solid #d9e2ec",
            background: "#f3f7fb",
          }}
        >
          <div style={{ fontSize: fs.meta, fontWeight: 700, color: "#365b7d" }}>
            リンク先プレビュー
          </div>
          <div
            style={{
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: fs.body,
              fontWeight: 600,
            }}
            title={`${targetTitle}${targetSection ? ` › ${targetSection.title}` : ""}`}
          >
            {targetTitle || "選択したページ"}
            {targetSection
              ? ` › ${targetSection.title}`
              : doc.targetAnchor
                ? " › 見出しが見つかりません"
                : " › ページの先頭"}
          </div>
          {targetPath ? (
            <code
              style={{
                display: "block",
                marginTop: 2,
                overflow: "hidden",
                color: "#52606d",
                fontSize: fs.meta,
                fontFamily: "ui-monospace, monospace",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {targetPath}
            </code>
          ) : null}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <PagePreview page={previewPage} highlightSectionId={doc.targetAnchor} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        color: "#333",
        overflowY: "auto",
        height: "100%",
        fontSize: fs.body,
        fontFamily: "var(--font-body)",
        lineHeight: 1.7,
      }}
    >
      <main className="layout-program" id="preview-main">
        <article className="announcement-detail">
          <div className="announcement-detail__meta">
            {dateStr && (
              <time className="announcement-detail__date" dateTime={doc.date ?? undefined}>
                {dateStr}
              </time>
            )}
            {doc.pinned && <span className="announcement__pin">固定 Pinned</span>}
          </div>
          <h1 className="announcement-detail__title">
            {ja(doc.title ?? undefined)}
            {en(doc.title ?? undefined) && (
              <span className="announcement-detail__title-en" lang="en" translate="no">
                {en(doc.title ?? undefined)}
              </span>
            )}
          </h1>
          <BilingualPortableText field={bodyField} />
          {resolvedDocs.length > 0 && (
            <div className="announcement-detail__docs">
              <DocList docs={resolvedDocs} />
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
