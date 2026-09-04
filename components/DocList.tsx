"use client";

import { useMemo, useState, useCallback } from "react";
import { stegaClean } from "next-sanity";
import type { Document } from "@/lib/types";
import { ja, en } from "@/lib/i18n";
import {
  documentTypeLabel,
  isPdfDocument,
  pdfViewerPath,
  shouldUseNativePdfViewer,
} from "@/lib/document-links";
import PdfViewer, { type PdfViewerItem } from "./PdfViewer";

interface DocListProps {
  docs: Document[];
  sidebar?: boolean;
  openFilesInNewTab?: boolean;
}

function docTitle(doc: Document): string {
  return ja(doc.label) + (en(doc.label) ? ` / ${en(doc.label)}` : "");
}

export default function DocList({ docs, sidebar, openFilesInNewTab = false }: DocListProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Build navigable PDF items list with their original doc indices
  const pdfItems = useMemo(() => {
    const items: (PdfViewerItem & { docIndex: number })[] = [];
    docs.forEach((d, i) => {
      if (isPdfDocument(d)) {
        items.push({
          url: stegaClean(d.url) || "",
          title: docTitle(d),
          docIndex: i,
        });
      }
    });
    return items;
  }, [docs]);

  // Map from original doc index → pdfItems index
  const docIndexToPdfIndex = useMemo(() => {
    const map = new Map<number, number>();
    pdfItems.forEach((item, pdfIdx) => {
      map.set(item.docIndex, pdfIdx);
    });
    return map;
  }, [pdfItems]);

  const handleNavigate = useCallback((index: number) => {
    setViewerIndex(index);
  }, []);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, doc: Document, docIndex: number) {
    if (!isPdfDocument(doc)) return;

    // Mobile/tablet fallback — iOS Safari can't reliably render PDFs in iframes.
    if (
      shouldUseNativePdfViewer({
        viewportWidth: window.innerWidth,
        hasCoarsePointer: window.matchMedia("(pointer: coarse)").matches,
      })
    ) {
      e.currentTarget.href = stegaClean(doc.url) || "";
      e.currentTarget.target = "_blank";
      e.currentTarget.rel = "noopener noreferrer";
      return;
    }

    if (openFilesInNewTab) return;

    e.preventDefault();
    const pdfIdx = docIndexToPdfIndex.get(docIndex);
    if (pdfIdx !== undefined) setViewerIndex(pdfIdx);
  }

  return (
    <>
      <ul className={`doc-list${sidebar ? " doc-list--sidebar" : ""}`}>
        {docs.map((d, i) => {
          const url = stegaClean(d.url) || "";
          const title = docTitle(d);
          const href = openFilesInNewTab && isPdfDocument(d) ? pdfViewerPath(url, title) : url;

          return (
            <li className="doc-list__item" key={i}>
              <a
                href={href}
                target={openFilesInNewTab ? "_blank" : undefined}
                rel={openFilesInNewTab ? "noopener noreferrer" : undefined}
                onClick={(e) => handleClick(e, d, i)}
              >
                <span className="doc-list__label">
                  {ja(d.label)}
                  {en(d.label) ? ` / ${en(d.label)}` : ""}
                </span>{" "}
                <span className="doc-list__type">({documentTypeLabel(d)})</span>
              </a>
            </li>
          );
        })}
      </ul>
      <PdfViewer
        items={pdfItems}
        currentIndex={viewerIndex ?? 0}
        isOpen={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
        onNavigate={handleNavigate}
      />
    </>
  );
}
