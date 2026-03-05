"use client";

import { useMemo, useState, useCallback } from "react";
import { stegaClean } from "next-sanity";
import type { Document } from "@/lib/types";
import { ja, en } from "@/lib/i18n";
import PdfViewer, { type PdfViewerItem } from "./PdfViewer";

interface DocListProps {
  docs: Document[];
  sidebar?: boolean;
}

const PDF_TYPES = new Set(["pdf", "PDF"]);

function isPdf(doc: Document): boolean {
  const t = (doc.type || "PDF").toUpperCase();
  return PDF_TYPES.has(t);
}

function docTitle(doc: Document): string {
  return ja(doc.label) + (en(doc.label) ? ` / ${en(doc.label)}` : "");
}

export default function DocList({ docs, sidebar }: DocListProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Build navigable PDF items list with their original doc indices
  const pdfItems = useMemo(() => {
    const items: (PdfViewerItem & { docIndex: number })[] = [];
    docs.forEach((d, i) => {
      if (isPdf(d)) {
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

  function handleClick(e: React.MouseEvent, doc: Document, docIndex: number) {
    if (!isPdf(doc)) return;

    e.preventDefault();

    // Mobile fallback — iOS Safari can't render PDFs in iframes
    if (window.innerWidth <= 768) {
      window.open(stegaClean(doc.url) || "", "_blank");
      return;
    }

    const pdfIdx = docIndexToPdfIndex.get(docIndex);
    if (pdfIdx !== undefined) setViewerIndex(pdfIdx);
  }

  return (
    <>
      <ul className={`doc-list${sidebar ? " doc-list--sidebar" : ""}`}>
        {docs.map((d, i) => (
          <li className="doc-list__item" key={i}>
            <a href={stegaClean(d.url) || ""} onClick={(e) => handleClick(e, d, i)}>
              <span className="doc-list__label">
                {ja(d.label)}
                {en(d.label) ? ` / ${en(d.label)}` : ""}
              </span>{" "}
              <span className="doc-list__type">({d.type || "PDF"})</span>
            </a>
          </li>
        ))}
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
