"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { TocEntry } from "@/lib/section-renderer";

interface SidebarTocProps {
  entries: TocEntry[];
  label?: ReactNode;
  className?: string;
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 3l5 5-5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SidebarToc({ entries, label, className }: SidebarTocProps) {
  const groups = useMemo(() => groupTocEntries(entries), [entries]);
  const flatEntries = useMemo(
    () => groups.flatMap((group) => [group.section, ...group.children]),
    [groups],
  );
  const [activeId, setActiveId] = useState<string>(flatEntries.length > 0 ? flatEntries[0].id : "");
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
    if (flatEntries.length > 0) setActiveId(flatEntries[0].id);
  }, [flatEntries]);

  useEffect(() => {
    if (flatEntries.length < 2) return;

    const ids = flatEntries.map((e) => e.id);
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
  }, [flatEntries]);

  if (flatEntries.length < 2) return null;

  const defaultLabel = (
    <>
      目次{" "}
      <span lang="en" translate="no">
        Contents
      </span>
    </>
  );

  return (
    <nav
      className={`ann-toc${className ? ` ${className}` : ""}${isOpen ? " ann-toc--open" : ""}`}
      aria-label="目次"
    >
      <button className="ann-toc__toggle" type="button" aria-expanded={isOpen} onClick={toggle}>
        <span className="ann-toc__label">{label ?? defaultLabel}</span>
        <ChevronIcon className="ann-toc__chevron" />
      </button>
      <div className="ann-toc__body">
        <div className="ann-toc__body-inner">
          {groups.map((group) => (
            <div
              className={`ann-toc__group${
                [group.section, ...group.children].some((entry) => entry.id === activeId)
                  ? " ann-toc__group--active"
                  : ""
              }`}
              key={group.section.id}
            >
              <TocLink
                entry={group.section}
                level="section"
                isActive={activeId === group.section.id}
                onClick={handleLinkClick}
              />
              {group.children.length > 0 && (
                <div className="ann-toc__sublist">
                  {group.children.map((child) => (
                    <TocLink
                      entry={child}
                      level="subsection"
                      isActive={activeId === child.id}
                      key={child.id}
                      onClick={handleLinkClick}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}

function TocLink({
  entry,
  level,
  isActive,
  onClick,
}: {
  entry: TocEntry;
  level: "section" | "subsection";
  isActive: boolean;
  onClick: (id: string) => void;
}) {
  return (
    <a
      href={`#${entry.id}`}
      className={`ann-toc__link ann-toc__link--${level}${isActive ? " ann-toc__link--active" : ""}`}
      onClick={() => onClick(entry.id)}
    >
      {entry.text}
      {entry.subtext && (
        <span className="ann-toc__link-en" lang="en" translate="no">
          {entry.subtext}
        </span>
      )}
    </a>
  );
}

function groupTocEntries(entries: TocEntry[]) {
  const groups: { section: TocEntry; children: TocEntry[] }[] = [];

  for (const entry of entries) {
    if (entry.level === "subsection" && groups.length > 0) {
      groups[groups.length - 1].children.push(entry);
      continue;
    }
    groups.push({ section: { ...entry, level: "section" }, children: [] });
  }

  return groups;
}
