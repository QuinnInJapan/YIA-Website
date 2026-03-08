"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { TocEntry } from "@/lib/section-renderer";

interface SidebarTocProps {
  entries: TocEntry[];
  label?: ReactNode;
  className?: string;
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SidebarToc({ entries, label, className }: SidebarTocProps) {
  const [activeId, setActiveId] = useState<string>(entries.length > 0 ? entries[0].id : "");
  const [isOpen, setIsOpen] = useState(false);
  const clickLockRef = useRef<number | null>(null);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const handleLinkClick = useCallback((id: string) => {
    setActiveId(id);
    setIsOpen(false);
    // Suppress observer updates while smooth scroll is in progress
    if (clickLockRef.current) clearTimeout(clickLockRef.current);
    clickLockRef.current = window.setTimeout(() => {
      clickLockRef.current = null;
    }, 800);
  }, []);

  // Reset active id when entries change (e.g. language switch)
  useEffect(() => {
    if (entries.length > 0) setActiveId(entries[0].id);
  }, [entries]);

  useEffect(() => {
    if (entries.length < 2) return;

    const ids = entries.map((e) => e.id);
    const OFFSET = 100; // px below viewport top to consider "current"

    function updateActive() {
      if (clickLockRef.current) return;

      // Find the last section whose top has scrolled past the offset line
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= OFFSET) {
          current = id;
        }
      }
      setActiveId(current);
    }

    window.addEventListener("scroll", updateActive, { passive: true });
    updateActive();

    return () => window.removeEventListener("scroll", updateActive);
  }, [entries]);

  if (entries.length < 2) return null;

  const defaultLabel = <>目次 <span lang="en">Contents</span></>;

  return (
    <nav className={`ann-toc${className ? ` ${className}` : ""}${isOpen ? " ann-toc--open" : ""}`} aria-label="目次">
      <button
        className="ann-toc__toggle"
        type="button"
        aria-expanded={isOpen}
        onClick={toggle}
      >
        <span className="ann-toc__label">
          {label ?? defaultLabel}
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
              onClick={() => handleLinkClick(e.id)}
            >
              {e.text}
              {e.subtext && (
                <span className="ann-toc__link-en" lang="en">{e.subtext}</span>
              )}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
