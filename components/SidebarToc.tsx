"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/section-renderer";

interface SidebarTocProps {
  entries: TocEntry[];
}

export default function SidebarToc({ entries }: SidebarTocProps) {
  const [activeId, setActiveId] = useState<string>(entries.length > 0 ? entries[0].id : "");

  useEffect(() => {
    if (entries.length < 2) return;

    const ids = entries.map((e) => e.id);
    const observer = new IntersectionObserver(
      (observerEntries) => {
        // Find the first entry that is intersecting
        for (const oe of observerEntries) {
          if (oe.isIntersecting) {
            setActiveId(oe.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [entries]);

  if (entries.length < 2) return null;

  return (
    <nav className="ann-toc" aria-label="目次">
      <div className="ann-toc__label">
        目次 <span lang="en">Contents</span>
      </div>
      {entries.map((e) => (
        <a
          href={`#${e.id}`}
          className={`ann-toc__link${activeId === e.id ? " ann-toc__link--active" : ""}`}
          key={e.id}
        >
          {e.textJa}
          {e.textEn && (
            <span className="ann-toc__link-en" lang="en">{e.textEn}</span>
          )}
        </a>
      ))}
    </nav>
  );
}
