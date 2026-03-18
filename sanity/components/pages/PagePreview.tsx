"use client";

import { useMemo } from "react";
import { ja, en } from "@/lib/i18n";
import { renderSections } from "@/lib/section-renderer";
import PageHero from "@/components/PageHero";
import PageSubtitle from "@/components/PageSubtitle";
import type { PageDoc } from "./types";
import type { Page, PageSection } from "@/lib/types";

export function PagePreview({ page }: { page: PageDoc }) {
  const { groups } = useMemo(
    () => renderSections((page.sections ?? []) as PageSection[]),
    [page.sections],
  );

  const subtitle = page.subtitle ?? undefined;
  const subtitleNode = ja(subtitle) ? (
    <div className="page-section">
      <PageSubtitle ja={ja(subtitle)} en={en(subtitle)} />
    </div>
  ) : null;

  return (
    <div
      style={{
        background: "#fff",
        color: "#333",
        overflowY: "auto",
        height: "100%",
        fontSize: 16,
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
        {subtitleNode}
        {groups}
      </main>
    </div>
  );
}
