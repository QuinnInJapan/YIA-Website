/**
 * Migration: Reorganize categories and rename all slugs
 *
 * Before:
 *   support    → seikatsusodan, honyaku, bosai
 *   learning   → kaiwasalon, gaikokugo, kokusairikai, nihongo-handbook
 *   events     → nihonbunka, kids, cooking
 *   exchange   → youthfo, homestay, englishguide, kokusaikoken, sistercity
 *   about      → aboutyia, kaiinn, sanjyokaiin
 *
 * After:
 *   services     (相談・サービス)    → counseling, translation, disaster-prep
 *   classes      (教室・講座)        → conversation-salon, foreign-languages, global-understanding, japanese-handbook, guide-training, cooking
 *   events       (イベント)          → japan-festival, kids, youth-forum
 *   partnerships (交流・協力)        → homestay, global-contribution, sister-city
 *   about        (YIAについて)       → about, membership, supporting-membership
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/migrate-categories-v3.mjs
 *
 * Add --dry-run to preview without writing.
 */

import { createClient } from "next-sanity";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

const DRY_RUN = process.argv.includes("--dry-run");

// ── Slug renames (old → new) ──────────────────────────────────────

const slugRenames = {
  seikatsusodan: "counseling",
  honyaku: "translation",
  bosai: "disaster-prep",
  kaiwasalon: "conversation-salon",
  gaikokugo: "foreign-languages",
  kokusairikai: "global-understanding",
  "nihongo-handbook": "japanese-handbook",
  englishguide: "guide-training",
  // cooking: stays "cooking"
  nihonbunka: "japan-festival",
  // kids: stays "kids"
  youthfo: "youth-forum",
  // homestay: stays "homestay"
  fairtrade: "global-contribution", // page-kokusaikoken was previously renamed to slug "fairtrade"
  sistercity: "sister-city",
  aboutyia: "about",
  kaiinn: "membership",
  sanjyokaiin: "supporting-membership",
};

// ── New category definitions ──────────────────────────────────────

const newCategories = {
  "category-services": {
    _id: "category-services",
    _type: "category",
    label: [
      { _key: "ja", value: "相談・サービス" },
      { _key: "en", value: "Consultation & Services" },
    ],
    description: [
      { _key: "ja", value: "安心して暮らせる場所から" },
      { _key: "en", value: "From a place where everyone belongs" },
    ],
  },
  "category-classes": {
    _id: "category-classes",
    _type: "category",
    label: [
      { _key: "ja", value: "教室・講座" },
      { _key: "en", value: "Learning" },
    ],
    description: [
      { _key: "ja", value: "互いを知り、学び合い" },
      { _key: "en", value: "We learn from each other" },
    ],
  },
  "category-events": {
    _id: "category-events",
    _type: "category",
    label: [
      { _key: "ja", value: "イベント" },
      { _key: "en", value: "Events" },
    ],
    description: [
      { _key: "ja", value: "出会いを重ねて" },
      { _key: "en", value: "Build connections" },
    ],
  },
  "category-partnerships": {
    _id: "category-partnerships",
    _type: "category",
    label: [
      { _key: "ja", value: "交流・協力" },
      { _key: "en", value: "Exchange & Partnerships" },
    ],
    description: [
      { _key: "ja", value: "世界とつながる横須賀へ" },
      { _key: "en", value: "And open Yokosuka to the world" },
    ],
  },
  "category-about": {
    _id: "category-about",
    _type: "category",
    label: [
      { _key: "ja", value: "YIAについて" },
      { _key: "en", value: "About YIA" },
    ],
  },
};

// ── New navigation mapping (category → page slugs, using OLD slugs for lookup) ──

const navMapping = [
  {
    _key: "nav-services",
    categoryId: "category-services",
    oldSlugs: ["seikatsusodan", "honyaku", "bosai"],
  },
  {
    _key: "nav-classes",
    categoryId: "category-classes",
    oldSlugs: ["kaiwasalon", "gaikokugo", "kokusairikai", "nihongo-handbook", "englishguide", "cooking"],
  },
  {
    _key: "nav-events",
    categoryId: "category-events",
    oldSlugs: ["nihonbunka", "kids", "youthfo"],
  },
  {
    _key: "nav-partnerships",
    categoryId: "category-partnerships",
    oldSlugs: ["homestay", "fairtrade", "sistercity"],
  },
  {
    _key: "nav-about",
    categoryId: "category-about",
    oldSlugs: ["aboutyia", "kaiinn", "sanjyokaiin"],
  },
];

// ── Old category IDs to delete (if different from new ones) ───────

const oldCategoryIdsToDelete = ["category-support", "category-learning", "category-exchange"];

// ── Run migration ────────────────────────────────────────────────

async function migrate() {
  // Fetch all pages and current navigation
  const [pages, nav] = await Promise.all([
    client.fetch(`*[_type == "page"]{ _id, slug, categoryRef }`),
    client.fetch(`*[_type == "navigation"][0]`),
  ]);

  // Build slug → page lookup
  const pageBySlug = new Map();
  for (const page of pages) {
    pageBySlug.set(page.slug, page);
  }

  // Build nav item lookup (from current navigation, keyed by page slug)
  const navItemBySlug = new Map();
  for (const cat of nav.categories) {
    for (const item of cat.items) {
      // Find the page this item references
      const page = pages.find((p) => p._id === item.pageRef?._ref);
      if (page) {
        navItemBySlug.set(page.slug, item);
      }
    }
  }

  console.log("\n=== Slug renames ===");
  for (const [oldSlug, newSlug] of Object.entries(slugRenames)) {
    const page = pageBySlug.get(oldSlug);
    console.log(`  ${oldSlug} → ${newSlug}  ${page ? "✓" : "✗ NOT FOUND"}`);
  }

  console.log("\n=== New category structure ===");
  for (const mapping of navMapping) {
    const cat = newCategories[mapping.categoryId];
    const ja = cat.label.find((l) => l._key === "ja")?.value;
    const en = cat.label.find((l) => l._key === "en")?.value;
    console.log(`  ${ja} (${en}):`);
    for (const oldSlug of mapping.oldSlugs) {
      const newSlug = slugRenames[oldSlug] || oldSlug;
      const page = pageBySlug.get(oldSlug);
      console.log(`    - ${oldSlug} → ${newSlug}  ${page ? "✓" : "✗ NOT FOUND"}`);
    }
  }

  if (DRY_RUN) {
    console.log("\n[DRY RUN] No changes written.\n");
    return;
  }

  const tx = client.transaction();

  // 1. Create/replace new category documents (published + draft)
  for (const [id, catData] of Object.entries(newCategories)) {
    // Fetch existing to preserve heroImage etc
    const existing = await client.fetch(`*[_id == $id][0]`, { id });
    tx.createOrReplace({ ...(existing || {}), ...catData });

    const draftId = `drafts.${id}`;
    const draft = await client.fetch(`*[_id == $id][0]`, { id: draftId });
    if (draft) {
      tx.createOrReplace({ ...draft, ...catData });
    }
  }

  // 2. Rename page slugs and update categoryRef
  for (const mapping of navMapping) {
    for (const oldSlug of mapping.oldSlugs) {
      const page = pageBySlug.get(oldSlug);
      if (!page) continue;

      const newSlug = slugRenames[oldSlug] || oldSlug;
      const newCatRef = { _type: "reference", _ref: mapping.categoryId };

      // Update published
      tx.patch(page._id, {
        set: { slug: newSlug, categoryRef: newCatRef },
      });

      // Update draft if exists
      const draftId = `drafts.${page._id}`;
      const draft = await client.fetch(`*[_id == $id][0]`, { id: draftId });
      if (draft) {
        tx.patch(draftId, {
          set: { slug: newSlug, categoryRef: newCatRef },
        });
      }
    }
  }

  // 3. Rebuild navigation document
  const newNavCategories = navMapping.map((mapping) => ({
    _key: mapping._key,
    categoryRef: { _ref: mapping.categoryId, _type: "reference" },
    items: mapping.oldSlugs.map((oldSlug) => {
      const navItem = navItemBySlug.get(oldSlug);
      if (!navItem) {
        throw new Error(`Nav item for slug "${oldSlug}" not found`);
      }
      return navItem;
    }),
  }));

  tx.patch(nav._id, { set: { categories: newNavCategories } });

  // 4. Delete old category documents that are no longer used
  for (const oldId of oldCategoryIdsToDelete) {
    const exists = await client.fetch(`*[_id == $id][0]`, { id: oldId });
    if (exists) tx.delete(oldId);

    const draftId = `drafts.${oldId}`;
    const draft = await client.fetch(`*[_id == $id][0]`, { id: draftId });
    if (draft) tx.delete(draftId);
  }

  const result = await tx.commit();
  console.log(`\nMigration complete. Transaction ID: ${result.transactionId}\n`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
