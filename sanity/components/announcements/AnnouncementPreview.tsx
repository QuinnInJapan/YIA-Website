"use client";

import { ja, en } from "@/lib/i18n";
import { formatDateDot } from "@/lib/date-format";
import { fileUrl } from "@/lib/sanity/image";
import BilingualPortableText from "@/components/BilingualPortableText";
import DocList from "@/components/DocList";
import type { AnnouncementDoc } from "./AnnouncementEditor";
import type { I18nBlocks } from "@/lib/i18n";
import type { Document } from "@/lib/types";

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

  return (
    <div
      style={{
        background: "#fff",
        color: "#333",
        overflowY: "auto",
        height: "100%",
        fontSize: 16,
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
