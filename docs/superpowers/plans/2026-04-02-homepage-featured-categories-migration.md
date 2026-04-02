# Homepage Featured Categories Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `slot1`–`slot4` object structure in the `homepageFeatured` Sanity document with a flat `categories[]` array of category references, simplifying both the data model and the studio editing UI.

**Architecture:** Migrate the live Sanity document first so the data is in the new shape before any code changes land. Then update schema, types, queries, data layer, studio UI, and supporting scripts in a single coordinated pass. The studio UI becomes a nav-ordered checklist (toggle categories in/out, max 4); order is always derived from nav, never stored.

**Tech Stack:** Next.js, Sanity (GROQ, schema), TypeScript

---

## File Map

| File                                                 | Change                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `scripts/migrate-homepage-featured.ts`               | **Create** — one-time migration: slot1-4 → categories array              |
| `sanity/schemas/homepageFeatured.ts`                 | **Modify** — replace 4 slot fields with `categories[]` array field       |
| `lib/types.ts`                                       | **Modify** — replace `HomepageFeaturedSlot` + `HomepageFeatured`         |
| `lib/sanity/queries.ts`                              | **Modify** — update GROQ projection                                      |
| `lib/data.ts`                                        | **Modify** — update `emptySiteData`, `getHomepageFeatured()`             |
| `sanity/components/homepage/types.ts`                | **Modify** — replace `HomepageFeaturedSlotData` + `HomepageFeaturedData` |
| `sanity/components/homepage/ProgramCardsSection.tsx` | **Rewrite** — checklist UI, category-only editing                        |
| `sanity/components/homepage/HomepagePreview.tsx`     | **Modify** — use `featured?.categories` instead of SLOT_KEYS             |
| `sanity/components/unified-pages/useNavData.ts`      | **Modify** — update deleteCategory check query                           |
| `scripts/seed-homepage-featured.ts`                  | **Modify** — write `categories[]` instead of slot1-4                     |

---

## Task 1: Write the migration script

**Files:**

- Create: `scripts/migrate-homepage-featured.ts`

- [ ] **Step 1: Create the script**

```typescript
/**
 * Migrate homepageFeatured from slot1-4 to categories array.
 *
 * Usage: npx tsx scripts/migrate-homepage-featured.ts
 *
 * Reads slot1.categoryRef._ref … slot4.categoryRef._ref and writes them
 * as a flat categories[] array. Safe to re-run — checks for already-migrated docs.
 */
import { createClient } from "next-sanity";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN!,
  useCdn: false,
});

async function main() {
  const doc = await client.fetch(`*[_type == "homepageFeatured"][0]`);
  if (!doc) {
    console.error("No homepageFeatured document found.");
    process.exit(1);
  }

  // Already migrated?
  if (Array.isArray(doc.categories)) {
    console.log("Already migrated — categories array exists. Nothing to do.");
    return;
  }

  const slotRefs = ["slot1", "slot2", "slot3", "slot4"]
    .map((key) => doc[key]?.categoryRef?._ref)
    .filter(Boolean) as string[];

  if (slotRefs.length === 0) {
    console.error("No valid slot categoryRefs found.");
    process.exit(1);
  }

  const categories = slotRefs.map((ref) => ({
    _type: "reference" as const,
    _ref: ref,
    _key: ref,
  }));

  await client
    .patch(doc._id)
    .set({ categories })
    .unset(["slot1", "slot2", "slot3", "slot4"])
    .commit();

  console.log(`Migrated ${categories.length} categories:`);
  categories.forEach((c) => console.log(`  ${c._ref}`));
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the migration against the live dataset**

```bash
npx tsx scripts/migrate-homepage-featured.ts
```

Expected output:

```
Migrated 4 categories:
  category-soudan
  category-kyoshitsu
  category-event
  category-koryu
Done.
```

- [ ] **Step 3: Verify in Sanity Studio or via fetch**

```bash
npx tsx -e "
import { createClient } from 'next-sanity';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET, apiVersion: '2024-01-01', useCdn: false });
c.fetch('*[_type==\"homepageFeatured\"][0]').then(d => console.log(JSON.stringify(d, null, 2)));
"
```

Expected: `categories` is an array of 4 reference objects; `slot1`–`slot4` are absent.

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-homepage-featured.ts
git commit -m "feat: add migration script for homepageFeatured slot1-4 → categories array"
```

---

## Task 2: Update Sanity schema

**Files:**

- Modify: `sanity/schemas/homepageFeatured.ts`

- [ ] **Step 1: Replace the schema**

Full file replacement:

```typescript
import { defineType, defineField } from "sanity";
import { StarIcon } from "@sanity/icons";

export default defineType({
  name: "homepageFeatured",
  title: "ホームページ注目カテゴリー",
  type: "document",
  icon: StarIcon,
  preview: {
    prepare: () => ({ title: "ホームページ注目カテゴリー" }),
  },
  fields: [
    defineField({
      name: "categories",
      title: "注目カテゴリー",
      type: "array",
      of: [{ type: "reference", to: [{ type: "category" }] }],
      validation: (Rule) => Rule.max(4),
      description:
        "ホームページに表示するカテゴリー（最大4件）。ナビゲーションの順序で表示されます。",
    }),
  ],
});
```

- [ ] **Step 2: Commit**

```bash
git add sanity/schemas/homepageFeatured.ts
git commit -m "feat(schema): replace homepageFeatured slot1-4 with categories array"
```

---

## Task 3: Update TypeScript types

**Files:**

- Modify: `lib/types.ts`
- Modify: `sanity/components/homepage/types.ts`

- [ ] **Step 1: Update `lib/types.ts`**

Find and replace the `HomepageFeaturedSlot` and `HomepageFeatured` interfaces (around line 267):

Remove:

```typescript
export interface HomepageFeaturedSlot {
  categoryRef: Category;
  pages: Page[];
}

export interface HomepageFeatured {
  _type: "homepageFeatured";
  slot1: HomepageFeaturedSlot;
  slot2: HomepageFeaturedSlot;
  slot3: HomepageFeaturedSlot;
  slot4: HomepageFeaturedSlot;
}
```

Replace with:

```typescript
export interface HomepageFeatured {
  _type: "homepageFeatured";
  categories: Category[];
}
```

- [ ] **Step 2: Update `sanity/components/homepage/types.ts`**

Remove:

```typescript
export interface HomepageFeaturedSlotData {
  categoryRef?: { _type?: string; _ref: string };
  pages?: { _type?: string; _ref: string; _key?: string }[];
}

export interface HomepageFeaturedData {
  _id: string;
  _type: string;
  _rev?: string;
  slot1?: HomepageFeaturedSlotData;
  slot2?: HomepageFeaturedSlotData;
  slot3?: HomepageFeaturedSlotData;
  slot4?: HomepageFeaturedSlotData;
  [key: string]: unknown;
}
```

Replace with:

```typescript
export interface HomepageFeaturedData {
  _id: string;
  _type: string;
  _rev?: string;
  categories?: { _type?: string; _ref: string; _key?: string }[];
  [key: string]: unknown;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts sanity/components/homepage/types.ts
git commit -m "feat(types): update HomepageFeatured to categories array shape"
```

---

## Task 4: Update data layer

**Files:**

- Modify: `lib/sanity/queries.ts`
- Modify: `lib/data.ts`

- [ ] **Step 1: Update GROQ query in `lib/sanity/queries.ts`**

Find (around line 30):

```groq
"homepageFeatured": *[_type == "homepageFeatured"][0]{
  slot1{ categoryRef->, pages[]-> },
  slot2{ categoryRef->, pages[]-> },
  slot3{ categoryRef->, pages[]-> },
  slot4{ categoryRef->, pages[]-> }
},
```

Replace with:

```groq
"homepageFeatured": *[_type == "homepageFeatured"][0]{
  categories[]->
},
```

- [ ] **Step 2: Update `emptySiteData` in `lib/data.ts`**

Find (around line 78):

```typescript
homepageFeatured: {
  _type: "homepageFeatured" as const,
  slot1: {
    categoryRef: {
      _type: "category" as const,
      _id: "",
      label: [],
      heroImage: { asset: { _ref: "" } },
    },
    pages: [],
  },
  slot2: { ... },
  slot3: { ... },
  slot4: { ... },
},
```

Replace with:

```typescript
homepageFeatured: {
  _type: "homepageFeatured" as const,
  categories: [],
},
```

- [ ] **Step 3: Update `getHomepageFeatured()` in `lib/data.ts`**

Find:

```typescript
export const getHomepageFeatured = cache(async (): Promise<FeaturedCard[]> => {
  const data = await getSiteData();
  const featured = data.homepageFeatured;
  const slots = [featured.slot1, featured.slot2, featured.slot3, featured.slot4];
  const nav = await getEnrichedNavigation();

  const valid = slots.filter((slot) => slot?.categoryRef?._id);
  if (valid.length < 4) {
    console.warn(`⚠ [data] homepageFeatured has only ${valid.length}/4 valid slots`);
  }

  return valid.map((slot) => {
    const cat = slot.categoryRef;
    const catId = shortId(cat._id);
    const navCat = nav.categories.find((c) => c.categoryId === catId);
    return {
      categoryId: catId,
      label: cat.label ?? [],
      heroImage: cat.heroImage,
      categoryUrl: `/${catId}`,
      pages: (navCat?.items ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
      })),
    };
  });
});
```

Replace with:

```typescript
export const getHomepageFeatured = cache(async (): Promise<FeaturedCard[]> => {
  const data = await getSiteData();
  const nav = await getEnrichedNavigation();
  const categories = data.homepageFeatured.categories ?? [];

  return categories.map((cat) => {
    const catId = shortId(cat._id);
    const navCat = nav.categories.find((c) => c.categoryId === catId);
    return {
      categoryId: catId,
      label: cat.label ?? [],
      heroImage: cat.heroImage,
      categoryUrl: `/${catId}`,
      pages: (navCat?.items ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
      })),
    };
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add lib/sanity/queries.ts lib/data.ts
git commit -m "feat(data): update getHomepageFeatured to read categories array"
```

---

## Task 5: Rewrite ProgramCardsSection

**Files:**

- Modify: `sanity/components/homepage/ProgramCardsSection.tsx`

The new UI: all available categories shown in nav order as a compact checklist. Checked = featured. Disabled (greyed) when 4 are already checked and this one isn't. The `categories` array passed to `updateField` is always in nav order (derived by filtering navCategories against selected refs).

- [ ] **Step 1: Rewrite the component**

Full file replacement:

```typescript
"use client";

import { useMemo } from "react";
import { useClient } from "sanity";
import createImageUrlBuilder from "@sanity/image-url";
import { Card, Stack, Flex, Text, Checkbox } from "@sanity/ui";
import { i18nGet } from "../shared/i18n";
import { SectionWrapper } from "./SectionWrapper";
import type {
  HomepageFeaturedData,
  CategoryData,
  NavCategoryData,
  PageData,
  UpdateFieldFn,
} from "./types";

const MAX_FEATURED = 4;

export function ProgramCardsSection({
  featured,
  categories,
  navCategories,
  updateField,
}: {
  featured: HomepageFeaturedData | null;
  categories: CategoryData[];
  navCategories: NavCategoryData[];
  allPages: PageData[];
  updateField: UpdateFieldFn;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(() => createImageUrlBuilder(client), [client]);

  // Nav-ordered list of available categories (excluding "about")
  const orderedCategories = useMemo(() => {
    return navCategories
      .map((nc) => categories.find((c) => c._id === nc.categoryId || c._id === `drafts.${nc.categoryId}`))
      .filter((c): c is CategoryData => !!c && c._id !== "category-about");
  }, [navCategories, categories]);

  const selectedRefs = useMemo(
    () => new Set((featured?.categories ?? []).map((r) => r._ref)),
    [featured],
  );

  function handleToggle(catId: string) {
    const isSelected = selectedRefs.has(catId);

    // Build new selection maintaining nav order
    let newRefs: string[];
    if (isSelected) {
      newRefs = [...selectedRefs].filter((r) => r !== catId);
    } else {
      if (selectedRefs.size >= MAX_FEATURED) return;
      newRefs = [...selectedRefs, catId];
    }

    // Sort by nav order
    const navOrder = orderedCategories.map((c) => c._id);
    newRefs.sort((a, b) => navOrder.indexOf(a) - navOrder.indexOf(b));

    const categories = newRefs.map((ref) => ({
      _type: "reference" as const,
      _ref: ref,
      _key: ref,
    }));

    updateField("homepageFeatured", "homepageFeatured", "categories", categories);
  }

  return (
    <SectionWrapper id="section-programs" title="注目カテゴリー (Featured Categories)">
      <Stack space={2}>
        <Text size={0} muted>
          表示するカテゴリーを選択（最大{MAX_FEATURED}件）。順序はナビゲーションに従います。
        </Text>
        <Card border radius={2} padding={1}>
          <Stack space={0}>
            {orderedCategories.map((cat, i) => {
              const catId = cat._id.replace(/^drafts\./, "");
              const isSelected = selectedRefs.has(catId) || selectedRefs.has(cat._id);
              const isDisabled = !isSelected && selectedRefs.size >= MAX_FEATURED;
              const imgUrl = cat.heroImage?.asset?._ref
                ? builder.image(cat.heroImage).width(80).height(45).fit("crop").auto("format").url()
                : null;

              return (
                <Card
                  key={cat._id}
                  padding={2}
                  radius={1}
                  tone={isSelected ? "primary" : "default"}
                  style={{
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.45 : 1,
                    borderTop: i > 0 ? "1px solid var(--card-border-color)" : undefined,
                  }}
                  onClick={() => !isDisabled && handleToggle(catId)}
                >
                  <Flex align="center" gap={3}>
                    <Checkbox
                      checked={isSelected}
                      readOnly
                      style={{ pointerEvents: "none", flexShrink: 0 }}
                    />
                    {imgUrl ? (
                      <div
                        style={{
                          width: 60,
                          height: 34,
                          borderRadius: 3,
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 60,
                          height: 34,
                          borderRadius: 3,
                          background: "var(--card-muted-bg-color, #eee)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Stack space={1} style={{ flex: 1 }}>
                      <Text size={1} weight={isSelected ? "semibold" : "regular"}>
                        {i18nGet(cat.label, "ja")}
                      </Text>
                      <Text size={0} muted>
                        {i18nGet(cat.label, "en")}
                      </Text>
                    </Stack>
                    {isSelected && (
                      <Text size={0} muted>
                        #{[...selectedRefs].indexOf(catId) + 1}
                      </Text>
                    )}
                  </Flex>
                </Card>
              );
            })}
          </Stack>
        </Card>
        <Text size={0} muted>
          {selectedRefs.size}/{MAX_FEATURED} 選択中
        </Text>
      </Stack>
    </SectionWrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add sanity/components/homepage/ProgramCardsSection.tsx
git commit -m "feat(studio): rewrite ProgramCardsSection as nav-ordered checklist"
```

---

## Task 6: Update HomepagePreview

**Files:**

- Modify: `sanity/components/homepage/HomepagePreview.tsx`

- [ ] **Step 1: Replace the SLOT_KEYS block**

Find (around line 47):

```typescript
const SLOT_KEYS = ["slot1", "slot2", "slot3", "slot4"] as const;
const featuredSlots = SLOT_KEYS.map(
  (key) => featured?.[key] as HomepageFeaturedSlotData | undefined,
).filter((slot): slot is HomepageFeaturedSlotData => !!slot?.categoryRef?._ref);
```

Replace with:

```typescript
const featuredCategoryRefs = featured?.categories ?? [];
```

- [ ] **Step 2: Update `renderProgramGrid()`**

Find:

```typescript
function renderProgramGrid() {
  if (featuredSlots.length === 0) return null;
  return (
    <section className="program-grid">
      {featuredSlots.map((slot, i) => {
        const catId = slot.categoryRef!._ref;
        const cat = categories.find((c) => c._id === catId || c._id === `drafts.${catId}`);
        if (!cat) return null;
        const img = imageUrl(cat.heroImage as any);
        const pos = hotspotPosition(cat.heroImage as any);
        const navCat = navCategories.find((nc) => nc.categoryId === catId);
        // Show only featured pages if specified, otherwise all nav items
        const pageItems =
          slot.pages && slot.pages.length > 0 && navCat
            ? slot.pages
                .map((ref) => navCat.items.find((ni) => ni.pageId === ref._ref))
                .filter(Boolean)
            : (navCat?.items ?? []);
        return (
          <div className="program-card" key={catId || i}>
```

Replace with:

```typescript
function renderProgramGrid() {
  if (featuredCategoryRefs.length === 0) return null;
  return (
    <section className="program-grid">
      {featuredCategoryRefs.map((ref, i) => {
        const catId = ref._ref;
        const cat = categories.find((c) => c._id === catId || c._id === `drafts.${catId}`);
        if (!cat) return null;
        const img = imageUrl(cat.heroImage as any);
        const pos = hotspotPosition(cat.heroImage as any);
        const navCat = navCategories.find((nc) => nc.categoryId === catId);
        const pageItems = navCat?.items ?? [];
        return (
          <div className="program-card" key={catId || i}>
```

- [ ] **Step 3: Remove the unused `HomepageFeaturedSlotData` import if present**

Check the imports at the top of `HomepagePreview.tsx`. Remove `HomepageFeaturedSlotData` if it appears there.

- [ ] **Step 4: Commit**

```bash
git add sanity/components/homepage/HomepagePreview.tsx
git commit -m "feat(preview): update HomepagePreview to use featured.categories array"
```

---

## Task 7: Update category deletion check

**Files:**

- Modify: `sanity/components/unified-pages/useNavData.ts`

- [ ] **Step 1: Update the GROQ query in `deleteCategory`**

Find (around line 339):

```typescript
const featured = await client.fetch<{ refs: string[] } | null>(
  `*[_type == "homepageFeatured"][0]{
    "refs": [slot1.categoryRef._ref, slot2.categoryRef._ref, slot3.categoryRef._ref, slot4.categoryRef._ref]
  }`,
);
if ((featured?.refs ?? []).includes(catRef)) {
```

Replace with:

```typescript
const featured = await client.fetch<{ refs: string[] } | null>(
  `*[_type == "homepageFeatured"][0]{
    "refs": categories[]._ref
  }`,
);
if ((featured?.refs ?? []).includes(catRef)) {
```

- [ ] **Step 2: Commit**

```bash
git add sanity/components/unified-pages/useNavData.ts
git commit -m "fix(nav): update deleteCategory featured check to use categories array"
```

---

## Task 8: Update seed script

**Files:**

- Modify: `scripts/seed-homepage-featured.ts`

- [ ] **Step 1: Rewrite the script**

Full file replacement:

```typescript
/**
 * Seed the homepageFeatured singleton from existing navigation data.
 *
 * Usage: npx tsx scripts/seed-homepage-featured.ts
 *
 * Populates the categories array using the first 4 non-about categories
 * from navigation. Safe to run on a fresh dataset.
 */
import { createClient } from "next-sanity";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN!,
  useCdn: false,
});

async function main() {
  const existing = await client.fetch(`*[_type == "homepageFeatured"][0]._id`);
  if (existing) {
    console.log("homepageFeatured document already exists — skipping seed.");
    return;
  }

  const nav = await client.fetch(`*[_type == "navigation"][0]{
    categories[]{
      categoryRef->{ _id }
    }
  }`);

  if (!nav?.categories?.length) {
    console.error("No navigation categories found — cannot seed.");
    process.exit(1);
  }

  const catIds = (nav.categories as any[])
    .map((c: any) => c.categoryRef?._id)
    .filter((id: string) => id && id !== "category-about")
    .slice(0, 4);

  if (catIds.length < 4) {
    console.warn(`Only ${catIds.length} categories found — need 4 for full seeding.`);
  }

  const categories = catIds.map((ref: string) => ({
    _type: "reference",
    _ref: ref,
    _key: ref,
  }));

  await client.createOrReplace({
    _id: "homepageFeatured",
    _type: "homepageFeatured",
    categories,
  });

  console.log(`homepageFeatured seeded with ${categories.length} categories:`);
  catIds.forEach((id: string) => console.log(`  ${id}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Commit**

```bash
git add scripts/seed-homepage-featured.ts
git commit -m "feat(seed): update seed-homepage-featured to write categories array"
```

---

## Task 9: Verify end-to-end

- [ ] **Step 1: Build to catch TypeScript errors**

```bash
npm run build
```

Expected: No type errors related to `HomepageFeatured`, `HomepageFeaturedSlot`, `slot1`–`slot4`.

- [ ] **Step 2: Check for stale slot references**

```bash
grep -r "slot1\|slot2\|slot3\|slot4\|HomepageFeaturedSlot[^e]" --include="*.ts" --include="*.tsx" lib/ sanity/components/ scripts/ | grep -v migrate-homepage-featured
```

Expected: No output (all references removed except the migration script).

- [ ] **Step 3: Start dev and verify homepage renders correctly**

```bash
npm run dev
```

Open `http://localhost:3000` and confirm the 4 program cards render with all nav pages visible.

Open the Sanity studio (`/studio`) → Homepage editor → 注目カテゴリー section. Confirm the checklist shows all nav categories with the 4 currently-featured ones checked.

- [ ] **Step 4: Final commit if any fixups were needed**

```bash
git add -p
git commit -m "fix: address any TypeScript errors from homepageFeatured migration"
```
