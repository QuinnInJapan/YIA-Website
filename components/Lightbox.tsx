"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

export interface LightboxItem {
  src: string;
  alt: string;
  caption: string;
}

/** Generate a small thumbnail URL from a Sanity image URL */
function thumbSrc(src: string): string {
  const encoded = encodeSrc(src);
  // Sanity CDN URLs support query params for transforms
  if (encoded.includes("cdn.sanity.io")) {
    const sep = encoded.includes("?") ? "&" : "?";
    return `${encoded}${sep}w=160&q=60`;
  }
  return encoded;
}

/** Encode src for browser: leave full URLs intact, encode local path segments */
function encodeSrc(p: string): string {
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const thumbStripRef = useRef<HTMLDivElement>(null);

  // Reset loaded state when navigating to a new image
  useEffect(() => {
    setImageLoaded(false);
  }, [currentIndex]);

  // Scroll active thumbnail into view
  useEffect(() => {
    const strip = thumbStripRef.current;
    if (!strip) return;
    const active = strip.children[currentIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentIndex]);

  const show = useCallback(
    (idx: number) => {
      onNavigate(((idx % items.length) + items.length) % items.length);
    },
    [items.length, onNavigate]
  );

  // Preload all images when lightbox opens
  useEffect(() => {
    if (!isOpen) return;
    items.forEach((item, i) => {
      if (i === currentIndex) return; // current image already loading
      const img = new Image();
      img.src = encodeSrc(item.src);
    });
    // Only run on open, not on every navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Lock body scroll, keyboard nav, focus management, and touch gestures
  useEffect(() => {
    if (!isOpen) return;

    // Save and move focus
    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";
    const closeBtn = dialogRef.current?.querySelector<HTMLElement>(
      ".photo-lightbox__close"
    );
    closeBtn?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") show(currentIndex - 1);
      else if (e.key === "ArrowRight") show(currentIndex + 1);
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

    const el = dialogRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      // Only count horizontal swipes (dx must be dominant and at least 50px)
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) show(currentIndex + 1); // swipe left → next
        else show(currentIndex - 1); // swipe right → prev
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    el?.addEventListener("touchstart", handleTouchStart, { passive: true });
    el?.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      el?.removeEventListener("touchstart", handleTouchStart);
      el?.removeEventListener("touchend", handleTouchEnd);
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
        <div className="photo-lightbox__image-wrap">
          {!imageLoaded && <div className="photo-lightbox__spinner" aria-label="Loading image" />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={`photo-lightbox__image${imageLoaded ? " photo-lightbox__image--loaded" : ""}`}
            src={encodeSrc(item.src)}
            alt={item.alt}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
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
      {items.length > 1 && (
        <div className="photo-lightbox__thumbstrip" ref={thumbStripRef} role="tablist" aria-label="Gallery thumbnails">
          {items.map((thumb, i) => (
            <button
              key={i}
              className={`photo-lightbox__thumb${i === currentIndex ? " photo-lightbox__thumb--active" : ""}`}
              type="button"
              role="tab"
              aria-selected={i === currentIndex}
              aria-label={`Image ${i + 1} of ${items.length}`}
              onClick={() => show(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbSrc(thumb.src)} alt="" />
            </button>
          ))}
        </div>
      )}
      <div className="photo-lightbox__counter" aria-live="polite">
        {currentIndex + 1} / {items.length}
      </div>
    </div>
  );

  return createPortal(lightbox, document.body);
}
