"use client";

import { useMemo } from "react";
import { PortableText } from "@portabletext/react";
import { ja, en, jaBlocks, enBlocks } from "@/lib/i18n";
import { imageUrl, hotspotPosition, fileUrl } from "@/lib/sanity/image";
import { formatDateDot } from "@/lib/date-format";
import { blogPtComponents } from "@/lib/portable-text";
import DocList from "@/components/DocList";
import BlogLanguageTabs, { BlogLanguageProvider } from "@/components/BlogLanguageTabs";
import type { BlogPostDoc } from "./PostEditor";
import type { I18nBlocks } from "@/lib/i18n";
import type { Document } from "@/lib/types";

function hasContent(blocks: unknown[]): boolean {
  if (blocks.length === 0) return false;
  return blocks.some((b: unknown) => {
    const block = b as { _type?: string; children?: { text?: string }[] };
    return block._type !== "block" || block.children?.some((c) => c.text?.trim());
  });
}

/** Resolve file URLs client-side */
function resolveDocsClient(docs: BlogPostDoc["body"] extends any ? any[] : never): Document[] {
  if (!docs?.length) return [];
  return docs.map((doc: any) => {
    const resolved = doc.file ? fileUrl(doc.file) : "";
    return { ...doc, url: resolved || doc.url || "" } as unknown as Document;
  });
}

export function BlogPostPreview({ doc }: { doc: BlogPostDoc }) {
  const heroSrc = imageUrl(doc.heroImage as any);
  const heroPosition = hotspotPosition(doc.heroImage as any);
  const dateStr = doc.publishedAt ? formatDateDot(doc.publishedAt.slice(0, 10)) : "";
  const catLabel = ja(doc.category ?? undefined) || null;

  const jaB = jaBlocks(doc.body as I18nBlocks | undefined);
  const enB = enBlocks(doc.body as I18nBlocks | undefined);

  const jaBody = useMemo(
    () =>
      hasContent(jaB) ? (
        <div className="blog-post__body-ja">
          <PortableText value={jaB} components={blogPtComponents} />
        </div>
      ) : null,
    [jaB],
  );

  const enBody = useMemo(
    () =>
      hasContent(enB) ? (
        <div className="blog-post__body-en" lang="en" translate="no">
          <PortableText value={enB} components={blogPtComponents} />
        </div>
      ) : null,
    [enB],
  );

  const hasEn = hasContent(enB);

  // Resolve documents if the post has any (blogPost schema may include documents)
  const resolvedDocs = resolveDocsClient((doc as any).documents ?? []);

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
      {/* Hero */}
      <div className={`blog-post__hero${heroSrc ? "" : " blog-post__hero--no-image"}`}>
        {heroSrc && (
          <img
            src={heroSrc}
            alt={ja(doc.heroImage?.alt ?? undefined) || ja(doc.title ?? undefined)}
            className="blog-post__hero-img"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              ...(heroPosition ? { objectPosition: heroPosition } : {}),
            }}
          />
        )}
        <div className="blog-post__hero-overlay">
          {catLabel && <span className="blog-post__category">{catLabel}</span>}
          <h1 className="blog-post__title">{ja(doc.title ?? undefined)}</h1>
          {en(doc.title ?? undefined) && (
            <p className="blog-post__title-en" lang="en" translate="no">
              {en(doc.title ?? undefined)}
            </p>
          )}
          <div className="blog-post__meta">
            {dateStr && <time>{dateStr}</time>}
            {doc.author && <span>{doc.author}</span>}
          </div>
        </div>
      </div>

      {/* Body */}
      <main className="layout-program" id="preview-main">
        <article className="blog-post__body">
          <BlogLanguageProvider hasEn={hasEn}>
            <BlogLanguageTabs jaContent={jaBody} enContent={enBody} />
            {resolvedDocs.length > 0 && (
              <div className="blog-post__docs">
                <DocList docs={resolvedDocs} />
              </div>
            )}
          </BlogLanguageProvider>
        </article>
      </main>
    </div>
  );
}
