"use client";

import { useEffect, useMemo, useRef } from "react";
import { fs } from "@/sanity/lib/studioTokens";
import { ja, en } from "@/lib/i18n";
import { renderSections } from "@/lib/section-renderer";
import PageHero from "@/components/PageHero";
import type { PageDoc } from "./types";
import type { Page, PageSection } from "@/lib/types";

export function PagePreview({
  page,
  highlightSectionId,
}: {
  page: PageDoc;
  highlightSectionId?: string | null;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const { groups } = useMemo(
    () => renderSections((page.sections ?? []) as PageSection[]),
    [page.sections],
  );

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    for (const section of preview.querySelectorAll<HTMLElement>("[data-target-highlight]")) {
      section.removeAttribute("data-target-highlight");
    }

    if (!highlightSectionId) {
      preview.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const target = Array.from(preview.querySelectorAll<HTMLElement>("[id]")).find(
      (element) => element.id === highlightSectionId,
    );
    if (!target) return;

    target.setAttribute("data-target-highlight", "true");
    const top = target.getBoundingClientRect().top - preview.getBoundingClientRect().top;
    preview.scrollTo({ top: Math.max(0, preview.scrollTop + top - 40), behavior: "smooth" });
  }, [groups, highlightSectionId]);

  return (
    <div
      ref={previewRef}
      className="page-target-preview"
      style={{
        background: "#fff",
        color: "#333",
        overflowY: "auto",
        height: "100%",
        fontSize: fs.body,
        fontFamily: "var(--font-body)",
        lineHeight: 1.7,
      }}
    >
      <style>{`
        .page-target-preview [data-target-highlight="true"] {
          position: relative;
          border-radius: 6px;
          outline: 3px solid #d69e2e;
          outline-offset: 5px;
          background: rgba(255, 243, 205, 0.5);
          box-shadow: 0 0 0 10px rgba(255, 243, 205, 0.22);
        }
      `}</style>
      <PageHero
        titleJa={ja(page.title ?? undefined)}
        titleEn={en(page.title ?? undefined)}
        description={page.description ?? undefined}
        images={(page.images as Page["images"]) ?? undefined}
      />
      <main className="layout-program" id="preview-main">
        {groups}
        <div style={{ height: 200 }} />
      </main>
    </div>
  );
}
