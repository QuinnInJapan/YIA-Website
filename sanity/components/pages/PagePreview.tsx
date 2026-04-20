"use client";

import { useMemo } from "react";
import { fs } from "@/sanity/lib/studioTokens";
import { ja, en } from "@/lib/i18n";
import { renderSections } from "@/lib/section-renderer";
import PageHero from "@/components/PageHero";
import type { PageDoc } from "./types";
import type { Page, PageSection } from "@/lib/types";

export function PagePreview({ page }: { page: PageDoc }) {
  const { groups } = useMemo(
    () => renderSections((page.sections ?? []) as PageSection[]),
    [page.sections],
  );

  return (
    <div
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
