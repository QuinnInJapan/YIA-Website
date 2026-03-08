"use client";

import { useBlogLang } from "@/components/BlogLanguageTabs";
import SidebarToc from "@/components/SidebarToc";
import type { TocEntry } from "@/lib/section-renderer";

interface BlogTocWrapperProps {
  jaEntries: TocEntry[];
  enEntries: TocEntry[];
}

export default function BlogTocWrapper({ jaEntries, enEntries }: BlogTocWrapperProps) {
  const lang = useBlogLang();
  const entries = lang === "en" && enEntries.length > 0 ? enEntries : jaEntries;
  const label = lang === "en" ? "Contents" : (<>目次 <span lang="en">Contents</span></>);

  return <SidebarToc entries={entries} label={label} className="blog-toc" />;
}
