"use client";

import { useState, useCallback } from "react";
import Lightbox, { type LightboxItem } from "./Lightbox";

interface GalleryImage {
  src: string;
  alt: string;
  captionJa?: string;
  captionEn?: string;
}

interface PhotoGalleryProps {
  images: GalleryImage[];
}

export default function PhotoGallery({ images }: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const lightboxItems: LightboxItem[] = images.map((img) => ({
    src: img.src,
    alt: img.alt,
    caption: [img.captionJa, img.captionEn].filter(Boolean).join(" "),
  }));

  const openLightbox = useCallback((idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  }, []);

  const count = images.length;

  const makeFigure = (img: GalleryImage, idx: number, cls?: string) => (
    <button
      className={`photo-gallery__thumb${cls ? ` ${cls}` : ""}`}
      type="button"
      data-index={idx}
      onClick={() => openLightbox(idx)}
      key={idx}
    >
      <figure className="photo-gallery__item">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.src}
          alt={img.alt}
          onError={(e) => {
            (e.target as HTMLImageElement).style.background =
              "var(--color-gray-mid)";
          }}
          onLoad={(e) => (e.target as HTMLImageElement).classList.add("loaded")}
        />
        {img.captionJa && (
          <figcaption>
            {img.captionJa}
            {img.captionEn && (
              <span className="photo-gallery__caption-en">
                {" "}
                {img.captionEn}
              </span>
            )}
          </figcaption>
        )}
      </figure>
    </button>
  );

  return (
    <>
      {count >= 3 ? (
        <div className="photo-gallery" data-gallery-count={count}>
          {makeFigure(images[0], 0, "photo-gallery__hero")}
          <div className="photo-gallery__grid">
            {images.slice(1).map((img, i) => makeFigure(img, i + 1))}
          </div>
        </div>
      ) : (
        <div
          className="photo-gallery photo-gallery--simple"
          data-gallery-count={count}
        >
          {images.map((img, i) => makeFigure(img, i))}
        </div>
      )}
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
