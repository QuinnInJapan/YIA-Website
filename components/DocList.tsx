"use client";

import { useState } from "react";
import type { Document } from "@/lib/types";
import PdfViewer from "./PdfViewer";

interface DocListProps {
  docs: Document[];
  sidebar?: boolean;
}

const PDF_TYPES = new Set(["pdf", "PDF"]);

function isPdf(doc: Document): boolean {
  const t = (doc.type || "PDF").toUpperCase();
  return PDF_TYPES.has(t);
}

export default function DocList({ docs, sidebar }: DocListProps) {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState("");

  function handleClick(e: React.MouseEvent, doc: Document) {
    if (!isPdf(doc)) return;

    e.preventDefault();

    // Mobile fallback — iOS Safari can't render PDFs in iframes
    if (window.innerWidth <= 768) {
      window.open(doc.url, "_blank");
      return;
    }

    setViewerUrl(doc.url);
    setViewerTitle(doc.label + (doc.labelEn ? ` / ${doc.labelEn}` : ""));
  }

  return (
    <>
      <ul className={`doc-list${sidebar ? " doc-list--sidebar" : ""}`}>
        {docs.map((d, i) => (
          <li className="doc-list__item" key={i}>
            <a href={d.url} onClick={(e) => handleClick(e, d)}>
              <span className="doc-list__label">
                {d.label}
                {d.labelEn ? ` / ${d.labelEn}` : ""}
              </span>{" "}
              <span className="doc-list__type">({d.type || "PDF"})</span>
            </a>
          </li>
        ))}
      </ul>
      <PdfViewer
        url={viewerUrl ?? ""}
        title={viewerTitle}
        isOpen={viewerUrl !== null}
        onClose={() => setViewerUrl(null)}
      />
    </>
  );
}
