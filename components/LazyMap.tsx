"use client";

import { useEffect, useRef, useState } from "react";

export default function LazyMap({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%" }}>
      {visible ? (
        <iframe
          src={src}
          width="100%"
          height="100%"
          style={{ border: 0, borderRadius: "6px" }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="YIA Access Map"
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "6px",
            backgroundColor: "#e8edf2",
          }}
        />
      )}
    </div>
  );
}
