"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

interface NavItem {
  id: string;
  titleJa: string;
  titleEn?: string;
  url: string;
}

interface NavCategory {
  id: string;
  labelJa: string;
  labelEn: string;
  items: NavItem[];
}

interface HandbookLink {
  label: string;
  subtitle?: string;
  url?: string;
}

interface SiteNavProps {
  categories: NavCategory[];
  handbook?: {
    titleJa: string;
    links: HandbookLink[];
  };
}

export default function SiteNav({ categories, handbook }: SiteNavProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  // Close on route change
  useEffect(() => {
    setOpenId(null);
  }, [pathname]);

  // Close on click outside
  useEffect(() => {
    if (!openId) return;
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenId(null);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openId]);

  // Close on Escape
  useEffect(() => {
    if (!openId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [openId]);

  return (
    <nav className="site-nav" ref={navRef}>
      <div className="site-nav__inner">
        <Link href="/" className={`site-nav__home${pathname === "/" ? " site-nav__home--active" : ""}`} aria-current={pathname === "/" ? "page" : undefined}>
          HOME
        </Link>
        {categories.map((cat) => (
          <div
            className={`site-nav__group${openId === cat.id ? " site-nav__group--open" : ""}`}
            key={cat.id}
          >
            <button
              className="site-nav__group-label"
              type="button"
              aria-expanded={openId === cat.id}
              aria-controls={`nav-dropdown-${cat.id}`}
              onClick={() => toggle(cat.id)}
            >
              {cat.labelJa}{" "}
              <span className="site-nav__group-en" lang="en">{cat.labelEn}</span>
            </button>
            <div className="site-nav__dropdown" id={`nav-dropdown-${cat.id}`} role="region" aria-label={`${cat.labelJa} ${cat.labelEn}`}>
              {cat.items.map((it) => {
                const isActive = pathname === it.url;
                return (
                <Link className={`nav-item${isActive ? " nav-item--active" : ""}`} href={it.url} key={it.id} aria-current={isActive ? "page" : undefined}>
                  <span className="nav-item__title">{it.titleJa}</span>
                  <span className="nav-item__en" lang="en">{it.titleEn}</span>
                </Link>
                );
              })}
            </div>
          </div>
        ))}
        {handbook && handbook.links.length > 0 && (
          <div
            className={`site-nav__group${openId === "handbook" ? " site-nav__group--open" : ""}`}
          >
            <button
              className="site-nav__group-label"
              type="button"
              aria-expanded={openId === "handbook"}
              aria-controls="nav-dropdown-handbook"
              onClick={() => toggle("handbook")}
            >
              {handbook.titleJa}{" "}
              <span className="site-nav__group-en" lang="en">
                Japanese Study &amp; Living Handbook
              </span>
            </button>
            <div className="site-nav__dropdown" id="nav-dropdown-handbook" role="region" aria-label={`${handbook.titleJa} Japanese Study & Living Handbook`}>
              {handbook.links.map((l, i) => (
                <a
                  className="nav-item nav-item--external"
                  href={l.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${l.label} (opens in new tab)`}
                  key={i}
                >
                  <span className="nav-item__title">{l.label}</span>
                  {l.subtitle && (
                    <span className="nav-item__en" lang="en">{l.subtitle}</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
