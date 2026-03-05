"use client";

import { useState } from "react";
import PdfViewer from "./PdfViewer";

interface PdfLinkProps {
  href: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function PdfLink({ href, title, children, className }: PdfLinkProps) {
  const [isOpen, setIsOpen] = useState(false);

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
        url={href}
        title={title}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
