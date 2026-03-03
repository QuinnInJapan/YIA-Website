"use client";

import { useEffect, type ReactNode } from "react";

export default function HomepageEffects({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // 1. Scroll reveal with IntersectionObserver
    const reveals = document.querySelectorAll(".reveal");
    let io: IntersectionObserver | null = null;
    if (reveals.length && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("reveal--visible");
              io?.unobserve(e.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      reveals.forEach((el) => io!.observe(el));
    } else {
      reveals.forEach((el) => el.classList.add("reveal--visible"));
    }

    // 2. Hero text fade-out on scroll
    const overlay = document.querySelector<HTMLElement>(".hero__overlay");
    const hero = document.querySelector<HTMLElement>(".hero-viewport");
    let scrollHandler: (() => void) | null = null;
    if (overlay && hero) {
      let ticking = false;
      scrollHandler = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            const h = hero.offsetHeight;
            const s = window.scrollY;
            if (s < h) {
              const p = s / (h * 0.6);
              overlay.style.opacity = String(Math.max(1 - p, 0));
              overlay.style.transform = `translateY(${s * 0.15}px)`;
            }
            ticking = false;
          });
        }
      };
      window.addEventListener("scroll", scrollHandler, { passive: true });
    }

    // 3. Counter animation on stat tiles
    const counters = document.querySelectorAll<HTMLElement>("[data-counter]");
    let cio: IntersectionObserver | null = null;
    if (counters.length && "IntersectionObserver" in window) {
      cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            cio?.unobserve(e.target);
            const target = parseInt(
              e.target.getAttribute("data-counter") || "0",
              10
            );
            const big =
              e.target.querySelector<HTMLElement>(".activity-grid__tile-big");
            if (!big) return;
            const duration = 1200;
            let t0: number | null = null;
            function step(ts: number) {
              if (!t0) t0 = ts;
              const p = Math.min((ts - t0) / duration, 1);
              const ease = 1 - Math.pow(1 - p, 3);
              big!.textContent = Math.round(target * ease) + "+";
              if (p < 1) requestAnimationFrame(step);
            }
            big.textContent = "0+";
            requestAnimationFrame(step);
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach((el) => cio!.observe(el));
    }

    return () => {
      io?.disconnect();
      cio?.disconnect();
      if (scrollHandler) {
        window.removeEventListener("scroll", scrollHandler);
      }
    };
  }, []);

  return <>{children}</>;
}
