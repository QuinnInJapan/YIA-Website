"use client";

import { createContext, useContext, useEffect, useState } from "react";

type BlogLang = "ja" | "en";

const BlogLangContext = createContext<BlogLang>("ja");

export function useBlogLang() {
  return useContext(BlogLangContext);
}

interface BlogLanguageProviderProps {
  hasEn: boolean;
  children: React.ReactNode;
}

export function BlogLanguageProvider({ hasEn, children }: BlogLanguageProviderProps) {
  const [tab, setTab] = useState<BlogLang>("ja");
  const [isTranslated, setIsTranslated] = useState(false);

  // Detect Google Translate activation
  useEffect(() => {
    const check = () => {
      const html = document.documentElement;
      setIsTranslated(
        html.classList.contains("translated-ltr") ||
        html.classList.contains("translated-rtl") ||
        html.lang !== "ja"
      );
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "lang"],
    });
    return () => observer.disconnect();
  }, []);

  const effectiveLang = (!hasEn || isTranslated) ? "ja" : tab;

  return (
    <BlogLangContext.Provider value={effectiveLang}>
      {(!hasEn || isTranslated) ? (
        children
      ) : (
        <BlogLangSetContext.Provider value={setTab}>
          {children}
        </BlogLangSetContext.Provider>
      )}
    </BlogLangContext.Provider>
  );
}

const BlogLangSetContext = createContext<((lang: BlogLang) => void) | null>(null);

interface BlogLanguageTabsProps {
  jaContent: React.ReactNode;
  enContent: React.ReactNode;
}

export default function BlogLanguageTabs({
  jaContent,
  enContent,
}: BlogLanguageTabsProps) {
  const lang = useContext(BlogLangContext);
  const setTab = useContext(BlogLangSetContext);

  // No tabs when provider forces Japanese (no English / Google Translate active)
  if (!setTab) {
    return <>{jaContent}</>;
  }

  return (
    <>
      <div className="blog-lang-tabs" role="tablist" aria-label="言語切替 Language">
        <button
          className={`blog-lang-tab${lang === "ja" ? " blog-lang-tab--active" : ""}`}
          role="tab"
          aria-selected={lang === "ja"}
          onClick={() => setTab("ja")}
          type="button"
        >
          日本語
        </button>
        <button
          className={`blog-lang-tab${lang === "en" ? " blog-lang-tab--active" : ""}`}
          role="tab"
          aria-selected={lang === "en"}
          onClick={() => setTab("en")}
          type="button"
        >
          English
        </button>
      </div>
      <div role="tabpanel">
        {lang === "ja" ? jaContent : enContent}
      </div>
    </>
  );
}
