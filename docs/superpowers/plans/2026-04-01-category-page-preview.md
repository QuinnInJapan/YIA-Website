# Category Page Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain list in `CategoryPreview` with a full visual preview that matches the live category page — hero image, category labels, and one card per visible page.

**Architecture:** Three changes. First, extend the GROQ query and `NavPageDoc` type so the studio fetches each page's first image and description. Second, rewrite `CategoryPreview.tsx` to render the same markup structure as `CategoryTemplate` (using the real CSS classes and `PageHero` component inside a white content div). Third, wrap it in `PreviewPanel` in `UnifiedPagesTool` so it gets the iframe + PC/SP toggle, matching the individual page preview experience exactly.

Hidden items are excluded from the preview entirely (they don't appear on the live site).

**Tech Stack:** React 19, Sanity Studio v5, Next.js 15, `next/image`, TypeScript, project CSS classes (`page-hero`, `cat-list`, `cat-item`, `layout-category`)

---

## File Map

| File                                                  | Action  | Responsibility                                                                |
| ----------------------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| `sanity/components/unified-pages/types.ts`            | Modify  | Add `firstImage` and `description` to `NavPageDoc`                            |
| `sanity/components/unified-pages/useNavData.ts`       | Modify  | Extend `PAGES_QUERY` to fetch first image and description                     |
| `sanity/components/unified-pages/CategoryPreview.tsx` | Rewrite | Render hero + cat-list matching live category page; accept `categoryDoc` prop |
| `sanity/components/UnifiedPagesTool.tsx`              | Modify  | Pass `categoryDoc`; wrap `CategoryPreview` in `PreviewPanel`                  |

---

### Task 1: Extend NavPageDoc type and PAGES_QUERY

**Files:**

- Modify: `sanity/components/unified-pages/types.ts`
- Modify: `sanity/components/unified-pages/useNavData.ts`

- [ ] **Step 1: Add `firstImage` and `description` to `NavPageDoc` in `types.ts`**

  Find the `NavPageDoc` interface (around line 59) and replace it with:

  ```typescript
  export interface NavPageDoc {
    _id: string;
    _type: "page";
    title?: I18nString[];
    slug?: string;
    categoryRef?: { _ref: string };
    firstImage?: ImageField;
    description?: I18nString[];
  }
  ```

  `ImageField` is already re-exported in this file. `I18nString` is the studio item type `{ _key: string; value: string }` (also already in scope).

- [ ] **Step 2: Extend `PAGES_QUERY` in `useNavData.ts`**

  Find the `PAGES_QUERY` constant (line 22) and replace it:

  ```typescript
  const PAGES_QUERY = `*[_type == "page" && !(_id in path("drafts.**"))] | order(_id asc) { _id, _type, title, slug, categoryRef, "firstImage": images[0].file, description[]{ _key, value } }`;
  ```

  `"firstImage": images[0].file` GROQ-renames the first image's file object to a flat field so we don't need nested access in the component. `description[]{ _key, value }` fetches the bilingual description array.

- [ ] **Step 3: Type-check**

  Run: `npx tsc --noEmit`

  Expected: no errors. The new fields are optional so existing call sites that don't use them are unaffected.

- [ ] **Step 4: Commit**

  ```bash
  git add sanity/components/unified-pages/types.ts \
          sanity/components/unified-pages/useNavData.ts
  git commit -m "feat(unified-pages): extend NavPageDoc with firstImage and description"
  ```

---

### Task 2: Rewrite CategoryPreview component

**Files:**

- Rewrite: `sanity/components/unified-pages/CategoryPreview.tsx`

- [ ] **Step 1: Replace the entire file with the new component**

  ```tsx
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
  ```

  **Type cast rationale:** The studio and app halves of this codebase use parallel but structurally identical types. `I18nString` from `@/lib/i18n` is `{ _key: string; value: string }[]`, which is the same underlying shape as the studio's `I18nString[]`. `as unknown as SanityImage` bridges `ImageField` → `SanityImage`; both share the same `{ asset, hotspot, crop }` shape and the guard `?.asset` ensures we never pass an image without a real asset reference.

- [ ] **Step 2: Type-check**

  Run: `npx tsc --noEmit`

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add sanity/components/unified-pages/CategoryPreview.tsx
  git commit -m "feat(unified-pages): rewrite CategoryPreview to match live category page layout"
  ```

---

### Task 3: Wire CategoryPreview into UnifiedPagesTool with PreviewPanel

**Files:**

- Modify: `sanity/components/UnifiedPagesTool.tsx`

- [ ] **Step 1: Wrap the CategoryPreview call in `renderRightPanel` with PreviewPanel and pass categoryDoc**

  Find the category case in `renderRightPanel()` (around line 288):

  ```tsx
  // Show category page list preview when a category is selected
  if (middlePanel?.type === "category") {
    const navCat = navData.categories.find((c) => c._key === middlePanel.key);
    if (navCat) {
      return (
        <RightPanel>
          <CategoryPreview navCat={navCat} pagesMap={navData.pagesMap} />
        </RightPanel>
      );
    }
  }
  ```

  Replace it with:

  ```tsx
  // Show category page list preview when a category is selected
  if (middlePanel?.type === "category") {
    const navCat = navData.categories.find((c) => c._key === middlePanel.key);
    if (navCat) {
      const categoryDoc = navData.categoryDocs.get(navCat.categoryRef?._ref);
      return (
        <RightPanel>
          <PreviewPanel>
            <CategoryPreview
              navCat={navCat}
              categoryDoc={categoryDoc}
              pagesMap={navData.pagesMap}
            />
          </PreviewPanel>
        </RightPanel>
      );
    }
  }
  ```

  `PreviewPanel` is already imported in `UnifiedPagesTool.tsx` (it's used for the page preview). No new import needed.

- [ ] **Step 2: Type-check**

  Run: `npx tsc --noEmit`

  Expected: no errors. `categoryDoc` is `CategoryDoc | undefined` which matches the prop type added in Task 2.

- [ ] **Step 3: Commit**

  ```bash
  git add sanity/components/UnifiedPagesTool.tsx
  git commit -m "feat(unified-pages): wrap CategoryPreview in PreviewPanel, pass categoryDoc"
  ```
