"use client";

import { useState, useCallback } from "react";
import Lightbox, { type LightboxItem } from "./Lightbox";

interface Flyer {
  src: string;
  alt: string;
  caption: string;
}

interface EventFlyerPairProps {
  flyers: Flyer[];
}

export default function EventFlyerPair({ flyers }: EventFlyerPairProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const lightboxItems: LightboxItem[] = flyers.map((f) => ({
    src: f.src,
    alt: f.alt,
    caption: f.caption,
  }));

  const openLightbox = useCallback((idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  }, []);

  // Build flyer buttons, pairing JA+EN flyers as needed
  let idx = 0;
  const elements: React.ReactNode[] = [];

  // Flyers come pre-processed with individual src/alt/caption
  flyers.forEach((f, i) => {
    elements.push(
      <button
        className="event-flyer event-flyer--clickable"
        type="button"
        data-flyer-index={i}
        onClick={() => openLightbox(i)}
        key={i}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={f.src}
          alt={f.alt}
          onLoad={(e) => (e.target as HTMLImageElement).classList.add("loaded")}
        />
        {f.caption && <figcaption>{f.caption}</figcaption>}
      </button>
    );
    idx++;
  });

  return (
    <>
      <div className="event-flyer-wrap">{elements}</div>
      <Lightbox
        items={lightboxItems}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
}
