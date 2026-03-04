"use client";

import Image from "next/image";
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

  const elements: React.ReactNode[] = [];

  flyers.forEach((f, i) => {
    elements.push(
      <button
        className="event-flyer event-flyer--clickable"
        type="button"
        data-flyer-index={i}
        onClick={() => openLightbox(i)}
        key={i}
      >
        <Image
          src={f.src}
          alt={f.alt}
          width={600}
          height={850}
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ width: "100%", height: "auto" }}
        />
        {f.caption && <figcaption>{f.caption}</figcaption>}
      </button>
    );
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
