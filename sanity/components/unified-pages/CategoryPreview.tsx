// sanity/components/unified-pages/CategoryPreview.tsx
"use client";

import Image from "next/image";
import PageHero from "@/components/PageHero";
import BilingualPortableText from "@/components/BilingualPortableText";
import { ja, en } from "@/lib/i18n";
import type { I18nString } from "@/lib/i18n";
import { imageUrl, hotspotPosition } from "@/lib/sanity/image";
import type { SanityImage } from "@/lib/types";
import type { NavCategoryRaw, NavPageDoc, CategoryDoc } from "./types";

export function CategoryPreview({
  navCat,
  categoryDoc,
  pagesMap,
}: {
  navCat: NavCategoryRaw;
  categoryDoc: CategoryDoc | undefined;
  pagesMap: Map<string, NavPageDoc>;
}) {
  const visibleItems = (navCat.items ?? []).filter((item) => !item.hidden);
  const labelJa = ja(categoryDoc?.label as I18nString) ?? "";
  const labelEn = en(categoryDoc?.label as I18nString) || undefined;
  const heroImages = categoryDoc?.heroImage?.asset
    ? [{ file: categoryDoc.heroImage as unknown as SanityImage }]
    : undefined;

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
      <PageHero titleJa={labelJa} titleEn={labelEn} images={heroImages} />
      <main className="layout-category">
        <div className="cat-list">
          {visibleItems.map((item) => {
            const page = pagesMap.get(item.pageRef._ref);
            if (!page) return null;
            const titleJa = ja(page.title as I18nString) ?? "";
            const titleEn = en(page.title as I18nString) || undefined;
            const img = page.firstImage?.asset
              ? imageUrl(page.firstImage as unknown as SanityImage)
              : "";
            const pos = page.firstImage?.asset
              ? hotspotPosition(page.firstImage as unknown as SanityImage)
              : undefined;
            return (
              <article className={`cat-item${img ? "" : " cat-item--no-img"}`} key={item._key}>
                {img && (
                  <div className="cat-item__img-wrap">
                    <Image
                      src={img}
                      alt=""
                      fill
                      className="cat-item__img"
                      style={pos ? { objectPosition: pos } : undefined}
                    />
                  </div>
                )}
                <div className="cat-item__body">
                  <h2 className="cat-item__title">
                    <span className="cat-item__link">{titleJa}</span>
                    {titleEn && (
                      <span className="cat-item__title-en" lang="en" translate="no">
                        {titleEn}
                      </span>
                    )}
                  </h2>
                  {page.description && page.description.length > 0 && (
                    <BilingualPortableText
                      field={page.description as I18nString}
                      className="cat-item__desc"
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <div style={{ height: 80 }} />
      </main>
    </div>
  );
}
