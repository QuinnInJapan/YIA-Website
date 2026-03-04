"use client";

import { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

export interface LightboxItem {
  src: string;
  alt: string;
  caption: string;
}

/** Encode path segments for browser src attributes (spaces → %20) */
function encodeSrc(p: string): string {
  return p
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

function LightboxCloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function LightboxArrowIcon({ direction }: { direction: "prev" | "next" }) {
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

interface LightboxProps {
  items: LightboxItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({
  items,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const show = useCallback(
    (idx: number) => {
      onNavigate(((idx % items.length) + items.length) % items.length);
    },
    [items.length, onNavigate]
  );

  // Lock body scroll, keyboard nav, and focus management
  useEffect(() => {
    if (!isOpen) return;

    // Save and move focus
    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";
    // Focus the close button on open
    const closeBtn = dialogRef.current?.querySelector<HTMLElement>(
      ".photo-lightbox__close"
    );
    closeBtn?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") show(currentIndex - 1);
      else if (e.key === "ArrowRight") show(currentIndex + 1);
      else if (e.key === "Tab") {
        // Focus trap
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
      // Restore focus
      previousFocusRef.current?.focus();
    };
  }, [isOpen, currentIndex, onClose, show]);

  if (!isOpen || !items.length) return null;

  const item = items[currentIndex];

  const lightbox = (
    <div
      className="photo-lightbox photo-lightbox--active"
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${currentIndex + 1} of ${items.length}`}
      ref={dialogRef}
    >
      <div
        className="photo-lightbox__backdrop"
        onClick={onClose}
        role="presentation"
      />
      <button
        className="photo-lightbox__close"
        type="button"
        aria-label="Close lightbox"
        onClick={onClose}
      >
        <LightboxCloseIcon />
      </button>
      <div className="photo-lightbox__content">
        <button
          className="photo-lightbox__nav photo-lightbox__nav--prev"
          type="button"
          aria-label={`Previous image (${currentIndex + 1} of ${items.length})`}
          onClick={() => show(currentIndex - 1)}
        >
          <LightboxArrowIcon direction="prev" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="photo-lightbox__image"
          src={encodeSrc(item.src)}
          alt={item.alt}
        />
        <button
          className="photo-lightbox__nav photo-lightbox__nav--next"
          type="button"
          aria-label={`Next image (${currentIndex + 1} of ${items.length})`}
          onClick={() => show(currentIndex + 1)}
        >
          <LightboxArrowIcon direction="next" />
        </button>
      </div>
      {item.caption && (
        <div className="photo-lightbox__caption">{item.caption}</div>
      )}
      <div className="photo-lightbox__counter" aria-live="polite">
        {currentIndex + 1} / {items.length}
      </div>
    </div>
  );

  return createPortal(lightbox, document.body);
}
