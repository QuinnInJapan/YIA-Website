"use client";

import { useCallback, useEffect, useState } from "react";
import type { TocEntry } from "@/lib/section-renderer";

interface SidebarTocProps {
  entries: TocEntry[];
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SidebarToc({ entries }: SidebarTocProps) {
  const [activeId, setActiveId] = useState<string>(entries.length > 0 ? entries[0].id : "");
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const handleLinkClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (entries.length < 2) return;

    const ids = entries.map((e) => e.id);
    // Track which sections are currently visible
    const visibleIds = new Set<string>();

    const observer = new IntersectionObserver(
      (observerEntries) => {
        for (const oe of observerEntries) {
          if (oe.isIntersecting) {
            visibleIds.add(oe.target.id);
          } else {
            visibleIds.delete(oe.target.id);
          }
        }
        // Highlight the first visible section in DOM order
        const firstVisible = ids.find((id) => visibleIds.has(id));
        if (firstVisible) {
          setActiveId(firstVisible);
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
    <nav className={`ann-toc${isOpen ? " ann-toc--open" : ""}`} aria-label="目次">
      <button
        className="ann-toc__toggle"
        type="button"
        aria-expanded={isOpen}
        onClick={toggle}
      >
        <span className="ann-toc__label">
          目次 <span lang="en">Contents</span>
        </span>
        <ChevronIcon className="ann-toc__chevron" />
      </button>
      <div className="ann-toc__body">
        <div className="ann-toc__body-inner">
          {entries.map((e) => (
            <a
              href={`#${e.id}`}
              className={`ann-toc__link${activeId === e.id ? " ann-toc__link--active" : ""}`}
              key={e.id}
              onClick={handleLinkClick}
            >
              {e.textJa}
              {e.textEn && (
                <span className="ann-toc__link-en" lang="en">{e.textEn}</span>
              )}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
