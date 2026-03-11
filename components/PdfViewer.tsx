"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface PdfViewerItem {
  url: string;
  title: string;
}

interface PdfViewerProps {
  items: PdfViewerItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {direction === "prev" ? (
        <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export default function PdfViewer({ items, currentIndex, isOpen, onClose, onNavigate }: PdfViewerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [loading, setLoading] = useState(true);

  const hasNav = items.length > 1;
  const item = items[currentIndex];

  // Reset loading state when the PDF changes
  useEffect(() => {
    if (isOpen) setLoading(true);
  }, [isOpen, currentIndex]);

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
      else if (e.key === "ArrowLeft" && hasNav) {
        onNavigate((currentIndex - 1 + items.length) % items.length);
      } else if (e.key === "ArrowRight" && hasNav) {
        onNavigate((currentIndex + 1) % items.length);
      } else if (e.key === "Tab") {
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
  }, [isOpen, onClose, hasNav, currentIndex, items.length, onNavigate]);

  if (!isOpen || !item) return null;

  const viewer = (
    <div
      className="pdf-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      ref={dialogRef}
    >
      <div
        className="pdf-viewer__backdrop"
        onClick={onClose}
        role="presentation"
      />

      {hasNav && (
        <button
          className="pdf-viewer__nav pdf-viewer__nav--prev"
          type="button"
          aria-label="Previous document"
          onClick={() => onNavigate((currentIndex - 1 + items.length) % items.length)}
        >
          <ArrowIcon direction="prev" />
        </button>
      )}

      <div className="pdf-viewer__content">
        <div className="pdf-viewer__panel">
          <div className="pdf-viewer__header">
            <span className="pdf-viewer__title">{item.title}</span>
            <button
              className="pdf-viewer__close"
              type="button"
              aria-label="Close"
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>
          <div className="pdf-viewer__body">
            {loading && (
              <div className="pdf-viewer__loading">
                <div className="pdf-viewer__spinner" />
                <span>読み込み中… Loading…</span>
              </div>
            )}
            <iframe
              className="pdf-viewer__iframe"
              src={item.url}
              title={item.title}
              onLoad={() => setLoading(false)}
            />
          </div>
        </div>

        {hasNav && (
          <div className="pdf-viewer__counter" aria-live="polite">
            {currentIndex + 1} / {items.length}
          </div>
        )}
      </div>

      {hasNav && (
        <button
          className="pdf-viewer__nav pdf-viewer__nav--next"
          type="button"
          aria-label="Next document"
          onClick={() => onNavigate((currentIndex + 1) % items.length)}
        >
          <ArrowIcon direction="next" />
        </button>
      )}
    </div>
  );

  return createPortal(viewer, document.body);
}
