"use client";

import { useEffect, useCallback } from "react";

export interface LightboxItem {
  src: string;
  alt: string;
  caption: string;
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
  const show = useCallback(
    (idx: number) => {
      onNavigate(((idx % items.length) + items.length) % items.length);
    },
    [items.length, onNavigate]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") show(currentIndex - 1);
      else if (e.key === "ArrowRight") show(currentIndex + 1);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentIndex, onClose, show]);

  if (!isOpen || !items.length) return null;

  const item = items[currentIndex];

  return (
    <div className="photo-lightbox photo-lightbox--active">
      <div className="photo-lightbox__backdrop" onClick={onClose} />
      <button
        className="photo-lightbox__close"
        type="button"
        aria-label="Close"
        onClick={onClose}
      >
        &times;
      </button>
      <button
        className="photo-lightbox__nav photo-lightbox__nav--prev"
        type="button"
        aria-label="Previous"
        onClick={() => show(currentIndex - 1)}
      >
        &#8249;
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="photo-lightbox__image"
        src={item.src}
        alt={item.alt}
      />
      <button
        className="photo-lightbox__nav photo-lightbox__nav--next"
        type="button"
        aria-label="Next"
        onClick={() => show(currentIndex + 1)}
      >
        &#8250;
      </button>
      <div className="photo-lightbox__caption">{item.caption}</div>
      <div className="photo-lightbox__counter">
        {currentIndex + 1} / {items.length}
      </div>
    </div>
  );
}
