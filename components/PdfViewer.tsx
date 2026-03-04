"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface PdfViewerProps {
  url: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2v10M5 8l4 4 4-4M3 14h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PdfViewer({ url, title, isOpen, onClose }: PdfViewerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    const closeBtn = dialogRef.current?.querySelector<HTMLElement>(
      ".pdf-viewer__close"
    );
    closeBtn?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const viewer = (
    <div
      className="pdf-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      ref={dialogRef}
    >
      <div
        className="pdf-viewer__backdrop"
        onClick={onClose}
        role="presentation"
      />
      <div className="pdf-viewer__panel">
        <div className="pdf-viewer__header">
          <span className="pdf-viewer__title">{title}</span>
          <a
            className="pdf-viewer__download"
            href={url}
            download
            aria-label="Download"
          >
            <DownloadIcon />
          </a>
          <button
            className="pdf-viewer__close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <iframe
          className="pdf-viewer__iframe"
          src={url}
          title={title}
        />
      </div>
    </div>
  );

  return createPortal(viewer, document.body);
}
