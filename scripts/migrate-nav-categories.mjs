/**
 * Migration: Reorganize navigation categories
 *
 * Before (by mission pillar):
 *   支援事業 → seikatsusodan, kaiwasalon, honyaku, bosai, nihongo-handbook
 *   啓発事業 → gaikokugo, kokusairikai, youthfo
 *   交流事業 → nihonbunka, kids, englishguide, homestay, cooking
 *   国際貢献 → kokusaikoken, sistercity
 *
 * After (by visitor intent):
 *   生活サポート (Living Support)   → seikatsusodan, honyaku, bosai
 *   語学・講座  (Language & Classes) → kaiwasalon, gaikokugo, kokusairikai, nihongo-handbook
 *   イベント   (Events)            → nihonbunka, kids, cooking
 *   国際交流   (Global Exchange)    → youthfo, homestay, englishguide, kokusaikoken, sistercity
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/migrate-nav-categories.mjs
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

// ── New category labels ──────────────────────────────────────────

const categoryUpdates = {
  "category-shien": {
    label: [
      { _key: "ja", value: "生活サポート" },
      { _key: "en", value: "Living Support" },
    ],
    description: [
      { _key: "ja", value: "安心して暮らせる場所から" },
      { _key: "en", value: "From a place where everyone belongs" },
    ],
  },
  "category-kehatsu": {
    label: [
      { _key: "ja", value: "語学・講座" },
      { _key: "en", value: "Language & Classes" },
    ],
    description: [
      { _key: "ja", value: "互いを知り、学び合い" },
      { _key: "en", value: "We learn from each other" },
    ],
  },
  "category-kouryu": {
    label: [
      { _key: "ja", value: "イベント" },
      { _key: "en", value: "Events" },
    ],
    description: [
      { _key: "ja", value: "出会いを重ねて" },
      { _key: "en", value: "Build connections" },
    ],
  },
  "category-kokusaikoken": {
    label: [
      { _key: "ja", value: "国際交流" },
      { _key: "en", value: "Global Exchange" },
    ],
    description: [
      { _key: "ja", value: "世界とつながる横須賀へ" },
      { _key: "en", value: "And open Yokosuka to the world" },
    ],
  },
};

// ── Fetch current nav items into a lookup ────────────────────────

async function fetchNavItems() {
  const nav = await client.fetch(`*[_type == "navigation"][0]`);
  /** @type {Map<string, object>} */
  const itemMap = new Map();
  for (const cat of nav.categories) {
    for (const item of cat.items) {
      itemMap.set(item.id, item);
    }
  }
  return { nav, itemMap };
}

// ── New navigation category→item mapping ─────────────────────────

const newMapping = [
  {
    _key: "key0",
    categoryRef: { _ref: "category-shien", _type: "reference" },
    itemIds: ["seikatsusodan", "honyaku", "bosai"],
  },
  {
    _key: "key1",
    categoryRef: { _ref: "category-kehatsu", _type: "reference" },
    itemIds: ["kaiwasalon", "gaikokugo", "kokusairikai", "nihongo-handbook"],
  },
  {
    _key: "key2",
    categoryRef: { _ref: "category-kouryu", _type: "reference" },
    itemIds: ["nihonbunka", "kids", "cooking"],
  },
  {
    _key: "key3",
    categoryRef: { _ref: "category-kokusaikoken", _type: "reference" },
    itemIds: ["youthfo", "homestay", "englishguide", "kokusaikoken", "sistercity"],
  },
  {
    _key: "key4",
    categoryRef: { _ref: "category-about", _type: "reference" },
    itemIds: ["aboutyia", "kaiinn", "sanjyokaiin"],
  },
];

// ── Run migration ────────────────────────────────────────────────

async function migrate() {
  const { nav, itemMap } = await fetchNavItems();

  // Build new categories array, reusing existing item objects
  const newCategories = newMapping.map((mapping) => ({
    _key: mapping._key,
    categoryRef: mapping.categoryRef,
    items: mapping.itemIds.map((id) => {
      const item = itemMap.get(id);
      if (!item) throw new Error(`Nav item "${id}" not found in current data`);
      return item;
    }),
  }));

  console.log("\n=== Category label changes ===");
  for (const [docId, update] of Object.entries(categoryUpdates)) {
    const ja = update.label.find((l) => l._key === "ja")?.value;
    const en = update.label.find((l) => l._key === "en")?.value;
    console.log(`  ${docId}: ${ja} / ${en}`);
  }

  console.log("\n=== New navigation structure ===");
  for (const cat of newCategories) {
    const catId = cat.categoryRef._ref;
    const update = categoryUpdates[catId];
    const label = update
      ? update.label.find((l) => l._key === "ja")?.value
      : "YIAについて";
    console.log(`  ${label}:`);
    for (const item of cat.items) {
      const ja = item.title?.find((t) => t._key === "ja")?.value;
      console.log(`    - ${ja} (${item.id})`);
    }
  }

  if (DRY_RUN) {
    console.log("\n[DRY RUN] No changes written.\n");
    return;
  }

  // Build transaction
  const tx = client.transaction();

  // Update category labels (published + draft variants)
  for (const [docId, update] of Object.entries(categoryUpdates)) {
    tx.createOrReplace({
      _id: docId,
      _type: "category",
      ...(await client.fetch(`*[_id == $id][0]`, { id: docId })),
      ...update,
    });
    // Also update draft if it exists
    const draftId = `drafts.${docId}`;
    const draft = await client.fetch(`*[_id == $id][0]`, { id: draftId });
    if (draft) {
      tx.createOrReplace({
        ...draft,
        ...update,
      });
    }
  }

  // Update navigation document
  tx.patch(nav._id, { set: { categories: newCategories } });

  const result = await tx.commit();
  console.log(`\nMigration complete. Transaction ID: ${result.transactionId}\n`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
