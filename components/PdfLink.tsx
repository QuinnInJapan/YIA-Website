"use client";

import { useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { shouldUseNativePdfViewer } from "@/lib/document-links";
import type { PdfViewerItem } from "./PdfViewer";

const PdfViewer = dynamic(() => import("./PdfViewer"), { ssr: false });

interface PdfLinkProps {
  href: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function PdfLink({ href, title, children, className }: PdfLinkProps) {
  const [isOpen, setIsOpen] = useState(false);

  const items: PdfViewerItem[] = useMemo(() => [{ url: href, title }], [href, title]);

  const handleNavigate = useCallback(() => {}, []);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!href) return;

    if (
      shouldUseNativePdfViewer({
        viewportWidth: window.innerWidth,
        hasCoarsePointer: window.matchMedia("(pointer: coarse)").matches,
      })
    ) {
      e.currentTarget.target = "_blank";
      e.currentTarget.rel = "noopener noreferrer";
      return;
    }

    e.preventDefault();
    setIsOpen(true);
  }

  return (
    <>
      <a href={href} onClick={handleClick} className={className}>
        {children}
      </a>
      {isOpen && (
        <PdfViewer
          items={items}
          currentIndex={0}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onNavigate={handleNavigate}
        />
      )}
    </>
  );
}
