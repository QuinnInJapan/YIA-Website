"use client";

import { useEffect, useState, useRef, useCallback } from "react";

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: {
      translate: {
        TranslateElement: new (
          config: {
            pageLanguage: string;
            includedLanguages: string;
            layout: number;
            autoDisplay: boolean;
          },
          elementId: string,
        ) => void;
      };
    };
  }
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh-CN", label: "中文" },
  { code: "ko", label: "한국어" },
  { code: "tl", label: "Tagalog" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ไทย" },
  { code: "ne", label: "नेपाली" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "fr", label: "Français" },
] as const;

// Stega zero-width characters that Sanity embeds for visual editing
const STEGA_RE = /[\u200B\u200C\u200D\uFEFF]+/g;

function getActiveLanguage(): string {
  const match = document.cookie.match(/googtrans=\/ja\/([^;]+)/);
  return match ? match[1] : "";
}

/** Walk a DOM subtree and strip stega characters from text nodes */
function stripStega(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (STEGA_RE.test(node.data)) {
      node.data = node.data.replace(STEGA_RE, "");
    }
  }
}

export default function GoogleTranslate() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleClickOutside, handleKeyDown]);

  // When translated: hide English text, strip stega chars, observe GT mutations
  useEffect(() => {
    if (active) {
      document.documentElement.classList.add("translated");
      // Strip stega from entire page once
      stripStega(document.body);
      // Watch for GT DOM mutations and clean stega from changed nodes
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === "characterData" && m.target.nodeType === Node.TEXT_NODE) {
            const t = m.target as Text;
            if (STEGA_RE.test(t.data)) {
              t.data = t.data.replace(STEGA_RE, "");
            }
          }
          for (const node of m.addedNodes) {
            stripStega(node);
          }
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      return () => observer.disconnect();
    } else {
      document.documentElement.classList.remove("translated");
    }
  }, [active]);

  // Skip GT entirely when inside an iframe (e.g. Sanity Presentation tool)
  const [inIframe] = useState(() =>
    typeof window !== "undefined" && window.self !== window.top,
  );

  // Initialize Google Translate + read initial cookie state
  useEffect(() => {
    if (inIframe) return;

    setActive(getActiveLanguage());

    // Mark all lang="en" elements as notranslate so Google Translate skips them
    document.querySelectorAll("[lang='en']").forEach((el) => {
      el.classList.add("notranslate");
    });

    // Define the callback Google Translate expects
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "ja",
          includedLanguages: "en,zh-CN,ko,tl,es,pt,vi,th,ne,id,fr",
          layout: 1,
          autoDisplay: false,
        },
        "google_translate_element",
      );
    };

    // Append the Google Translate script if not already present
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [inIframe]);

  function selectLanguage(code: string) {
    setOpen(false);

    if (!code) {
      // Reset: clear cookie and reload
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." + window.location.hostname;
      window.location.reload();
      return;
    }

    // Set the googtrans cookie
    document.cookie = `googtrans=/ja/${code}; path=/`;
    document.cookie = `googtrans=/ja/${code}; path=/; domain=.${window.location.hostname}`;

    // Drive the hidden GT select element
    const gtSelect = document.querySelector<HTMLSelectElement>(
      "#google_translate_element select",
    );
    if (gtSelect) {
      gtSelect.value = code;
      gtSelect.dispatchEvent(new Event("change"));
    }

    setActive(code);
  }

  const activeLabel = active
    ? LANGUAGES.find((l) => l.code === active)?.label ?? active
    : "翻訳 Translate";

  if (inIframe || dismissed) return null;

  return (
    <div className="gtranslate" ref={containerRef}>
      {/* Hidden GT widget — still needed for initialization */}
      <div
        id="google_translate_element"
        style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, overflow: "hidden" }}
      />

      <button
        className="gtranslate__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        type="button"
      >
        <svg
          className="gtranslate__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
        </svg>
        <span className="gtranslate__label">{activeLabel}</span>
      </button>
      <button
        className="gtranslate__close"
        onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
        aria-label="翻訳ボタンを非表示 Hide translate"
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <ul className={`gtranslate__menu${open ? " gtranslate__menu--open" : ""}`} role="menu">
        {LANGUAGES.map((lang) => (
          <li key={lang.code} role="none">
            <button
              className={`gtranslate__item${active === lang.code ? " gtranslate__item--active" : ""}`}
              role="menuitem"
              onClick={() => selectLanguage(lang.code)}
              tabIndex={open ? 0 : -1}
              type="button"
            >
              {lang.label}
            </button>
          </li>
        ))}
        <li role="none">
          <button
            className={`gtranslate__item${!active ? " gtranslate__item--active" : ""}`}
            role="menuitem"
            onClick={() => selectLanguage("")}
            tabIndex={open ? 0 : -1}
            type="button"
          >
            日本語（元の言語）
          </button>
        </li>
      </ul>
    </div>
  );
}
