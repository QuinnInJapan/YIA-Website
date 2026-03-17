"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface CounterTileProps {
  target: number;
  label: string;
  labelEn: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function CounterTile({
  target,
  label,
  labelEn,
  className,
  style,
}: CounterTileProps) {
  const [display, setDisplay] = useState(target);
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  const animate = useCallback(() => {
    if (fired.current) return;
    fired.current = true;

    const duration = 1200;
    let t0: number | null = null;

    function step(ts: number) {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(target * ease));
      if (p < 1) requestAnimationFrame(step);
    }

    setDisplay(0);
    requestAnimationFrame(step);
  }, [target]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate]);

  return (
    <div ref={ref} className={className} style={style}>
      <div className="activity-grid__tile-big">{display}+</div>
      <div className="activity-grid__tile-text">
        {label}
        <span>{labelEn}</span>
      </div>
    </div>
  );
}
