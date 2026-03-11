"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Homepage-specific effects:
 *   1. Hero overlay fade-out on scroll
 *   2. Program-band text exit fade
 *   3. Counter animation on stat tiles
 */
export default function HomepageEffects({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // 1. Hero text fade-out on scroll + band text exit fade
    const overlay = document.querySelector<HTMLElement>(".hero__overlay");
    const hero = document.querySelector<HTMLElement>(".hero-viewport");

    const bandTexts = Array.from(
      document.querySelectorAll<HTMLElement>(".program-band")
    ).map((band) => ({
      el: band,
      text: band.querySelector<HTMLElement>(".program-band__text"),
    }));

    // 2. Counter animation — track which counters have fired
    const counters = document.querySelectorAll<HTMLElement>("[data-counter]");
    const firedCounters = new WeakSet<Element>();

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
          const opacity =
            exitProgress > 0.1
              ? Math.max(0, 1 - (exitProgress - 0.1) / 0.3)
              : 1;
          text.style.opacity = String(opacity);
        }

        // Counter animation: fire when element center enters viewport
        for (const el of counters) {
          if (firedCounters.has(el)) continue;
          const rect = el.getBoundingClientRect();
          if (rect.top > vh || rect.bottom < 0) continue;
          // Element is at least partially visible — fire counter
          firedCounters.add(el);
          const target = parseInt(
            el.getAttribute("data-counter") || "0",
            10
          );
          const big =
            el.querySelector<HTMLElement>(".activity-grid__tile-big") ||
            el.querySelector<HTMLElement>(".culmination__stat-number");
          if (!big) continue;
          const duration = 1200;
          let t0: number | null = null;
          function step(ts: number) {
            if (!t0) t0 = ts;
            const p = Math.min((ts - t0) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            big!.textContent = Math.round(target * ease) + "+";
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
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

  return <>{children}</>;
}
