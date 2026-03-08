"use client";

import Link from "next/link";
import { useBlogLang } from "@/components/BlogLanguageTabs";
import { ja, en } from "@/lib/i18n";
import type { I18nString } from "@/lib/i18n";

interface AdjacentPost {
  title: I18nString;
  slug: string;
}

interface BlogPostNavProps {
  prev: AdjacentPost | null;
  next: AdjacentPost | null;
}

export default function BlogPostNav({ prev, next }: BlogPostNavProps) {
  const lang = useBlogLang();

  if (!prev && !next) return null;

  const t = lang === "en" ? en : ja;
  const fallback = lang === "en" ? ja : en;

  function title(post: AdjacentPost) {
    return t(post.title) || fallback(post.title);
  }

  return (
    <nav className="blog-post__nav" aria-label="前後の記事 Post navigation">
      {prev ? (
        <Link href={`/blog/${prev.slug}`} className="blog-post__nav-link blog-post__nav-link--prev">
          <span className="blog-post__nav-label">← {lang === "en" ? "Previous" : "前の記事"}</span>
          <span className="blog-post__nav-title">{title(prev)}</span>
        </Link>
      ) : <span />}
      {next ? (
        <Link href={`/blog/${next.slug}`} className="blog-post__nav-link blog-post__nav-link--next">
          <span className="blog-post__nav-label">{lang === "en" ? "Next" : "次の記事"} →</span>
          <span className="blog-post__nav-title">{title(next)}</span>
        </Link>
      ) : <span />}
    </nav>
  );
}
