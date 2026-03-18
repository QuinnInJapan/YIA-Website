"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Homepage-specific effects:
 *   1. Hero overlay fade-out on scroll
 *   2. Program-band text exit fade
 *   3. Scroll-down arrow on hero (fades when announcements enter view)
 */
export default function HomepageEffects({ children }: { children: ReactNode }) {
  const arrowRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // 1. Hero text fade-out on scroll + band text exit fade
    const overlay = document.querySelector<HTMLElement>(".hero__overlay");
    const hero = document.querySelector<HTMLElement>(".hero-viewport");

    const bandTexts = Array.from(document.querySelectorAll<HTMLElement>(".program-band")).map(
      (band) => ({
        el: band,
        text: band.querySelector<HTMLElement>(".program-band__text"),
      }),
    );

    const arrow = arrowRef.current;
    const annBand = document.querySelector(".oshirase-band");

    let ticking = false;
    const scrollHandler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const s = window.scrollY;
        const vh = window.innerHeight;

        // Hero fade-out
        if (overlay && hero) {
          const h = hero.offsetHeight;
          if (s < h) {
            const p = s / (h * 0.6);
            overlay.style.opacity = String(Math.max(1 - p, 0));
            overlay.style.transform = `translateY(${s * 0.15}px)`;
          }
        }

        // Band text: gentle exit fade as band scrolls out of view
        for (const { el, text } of bandTexts) {
          if (!text) continue;
          const rect = el.getBoundingClientRect();
          // Only apply exit fade once the band has entered the viewport
          if (rect.top >= vh) continue;
          const exitProgress = Math.max(0, -rect.top / rect.height);
          const opacity = exitProgress > 0.1 ? Math.max(0, 1 - (exitProgress - 0.1) / 0.3) : 1;
          text.style.opacity = String(opacity);
        }

        // Scroll arrow — hide once announcements band top reaches viewport
        if (arrow && annBand) {
          const rect = annBand.getBoundingClientRect();
          arrow.classList.toggle("hero-scroll--hidden", rect.top < vh);
        }

        ticking = false;
      });
    };
    window.addEventListener("scroll", scrollHandler, { passive: true });
    // Fire once on mount to handle elements already in view
    scrollHandler();

    return () => {
      window.removeEventListener("scroll", scrollHandler);
    };
  }, []);

  return (
    <>
      {children}
      <button
        ref={arrowRef}
        className="hero-scroll"
        type="button"
        aria-label="Scroll down"
        onClick={() => {
          document.querySelector(".oshirase-band")?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        <svg width="24" height="14" viewBox="0 0 24 14" fill="none" aria-hidden="true">
          <path
            d="M2 2l10 10L22 2"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </>
  );
}
