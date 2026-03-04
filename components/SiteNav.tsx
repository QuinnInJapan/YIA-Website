"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { I18nString } from "@/lib/i18n";
import { ja, en } from "@/lib/i18n";

interface NavItem {
  id: string;
  title: I18nString;
  url: string;
}

interface NavCategory {
  id: string;
  label: I18nString;
  items: NavItem[];
}

interface SiteNavProps {
  categories: NavCategory[];
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function SiteNav({ categories }: SiteNavProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Close on route change
  useEffect(() => {
    setOpenId(null);
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  // Close desktop dropdown on click outside
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

  // Close desktop dropdown on Escape
  useEffect(() => {
    if (!openId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [openId]);

  // Body scroll lock when mobile menu open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on Escape + focus trap
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMobileMenu();
        hamburgerRef.current?.focus();
      } else if (e.key === "Tab") {
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen, closeMobileMenu]);

  // Focus first element in drawer when opened
  useEffect(() => {
    if (isMobileMenuOpen) {
      const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
        'button, a[href], [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [isMobileMenuOpen]);

  return (
    <nav className="site-nav" ref={navRef}>
      {/* Hamburger button — visible only on mobile */}
      <button
        className="site-nav__hamburger"
        ref={hamburgerRef}
        type="button"
        aria-expanded={isMobileMenuOpen}
        aria-controls="site-nav-mobile"
        aria-label="メニュー Menu"
        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
      >
        <span className="site-nav__hamburger-line" />
        <span className="site-nav__hamburger-line" />
        <span className="site-nav__hamburger-line" />
      </button>

      {/* Desktop nav — hidden on mobile */}
      <div className="site-nav__desktop">
        <div className="site-nav__inner">
          <Link href="/" className={`site-nav__home${pathname === "/" ? " site-nav__home--active" : ""}`} aria-current={pathname === "/" ? "page" : undefined}>
            HOME
          </Link>
          {categories.map((cat) => {
            const hasActive = cat.items.some((it) => pathname === it.url);
            return (
            <div
              className={`site-nav__group${openId === cat.id ? " site-nav__group--open" : ""}${hasActive ? " site-nav__group--active" : ""}`}
              key={cat.id}
            >
              <button
                className="site-nav__group-label"
                type="button"
                aria-expanded={openId === cat.id}
                aria-controls={`nav-dropdown-${cat.id}`}
                onClick={() => toggle(cat.id)}
              >
                {ja(cat.label)}{" "}
                <span className="site-nav__group-en" lang="en">{en(cat.label)}</span>
              </button>
              <div className="site-nav__dropdown" id={`nav-dropdown-${cat.id}`} role="region" aria-label={`${ja(cat.label)} ${en(cat.label)}`}>
                {cat.items.map((it) => {
                  const isActive = pathname === it.url;
                  return (
                  <Link className={`nav-item${isActive ? " nav-item--active" : ""}`} href={it.url} key={it.id} aria-current={isActive ? "page" : undefined}>
                    <span className="nav-item__title">{ja(it.title)}</span>
                    <span className="nav-item__en" lang="en">{en(it.title)}</span>
                  </Link>
                  );
                })}
              </div>
            </div>
          );
          })}
        </div>
      </div>

      {/* Mobile drawer — hidden on desktop */}
      {isMobileMenuOpen && (
        <div
          className="site-nav__backdrop"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
      <div
        className={`site-nav__mobile${isMobileMenuOpen ? " site-nav__mobile--open" : ""}`}
        id="site-nav-mobile"
        ref={drawerRef}
        role="dialog"
        aria-modal={isMobileMenuOpen}
        aria-label="メニュー Menu"
      >
        <button
          className="site-nav__mobile-close"
          type="button"
          aria-label="メニューを閉じる Close menu"
          onClick={closeMobileMenu}
        >
          <CloseIcon />
        </button>

        <Link
          href="/"
          className={`site-nav__mobile-home${pathname === "/" ? " site-nav__mobile-home--active" : ""}`}
          aria-current={pathname === "/" ? "page" : undefined}
          onClick={closeMobileMenu}
        >
          HOME
        </Link>

        {categories.map((cat) => {
          const isOpen = openId === cat.id;
          const hasActive = cat.items.some((it) => pathname === it.url);
          return (
            <div className="site-nav__mobile-group" key={cat.id}>
              <button
                className={`site-nav__mobile-group-label${hasActive ? " site-nav__mobile-group-label--has-active" : ""}`}
                type="button"
                aria-expanded={isOpen}
                aria-controls={`mobile-nav-${cat.id}`}
                onClick={() => toggle(cat.id)}
              >
                <span>
                  {ja(cat.label)}{" "}
                  <span className="site-nav__mobile-group-en" lang="en">{en(cat.label)}</span>
                </span>
                <ChevronIcon className={`site-nav__mobile-chevron${isOpen ? " site-nav__mobile-chevron--open" : ""}`} />
              </button>
              <div
                className={`site-nav__mobile-accordion${isOpen ? " site-nav__mobile-accordion--open" : ""}`}
                id={`mobile-nav-${cat.id}`}
                role="region"
                aria-label={`${ja(cat.label)} ${en(cat.label)}`}
              >
                <div className="site-nav__mobile-accordion-inner">
                  {cat.items.map((it) => {
                    const isActive = pathname === it.url;
                    return (
                      <Link
                        className={`site-nav__mobile-link${isActive ? " site-nav__mobile-link--active" : ""}`}
                        href={it.url}
                        key={it.id}
                        aria-current={isActive ? "page" : undefined}
                        onClick={closeMobileMenu}
                      >
                        <span className="nav-item__title">{ja(it.title)}</span>
                        <span className="nav-item__en" lang="en">{en(it.title)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}


      </div>
    </nav>
  );
}
