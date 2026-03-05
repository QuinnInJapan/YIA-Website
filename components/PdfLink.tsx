"use client";

import { useMemo, useState, useCallback } from "react";
import PdfViewer, { type PdfViewerItem } from "./PdfViewer";

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

  function handleClick(e: React.MouseEvent) {
    if (!href) return;
    e.preventDefault();

    if (window.innerWidth <= 768) {
      window.open(href, "_blank");
      return;
    }

    setIsOpen(true);
  }

  return (
    <>
      <a href={href} onClick={handleClick} className={className}>
        {children}
      </a>
      <PdfViewer
        items={items}
        currentIndex={0}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onNavigate={handleNavigate}
      />
    </>
  );
}
