#!/usr/bin/env node
/**
 * Update English translations for navigation items and categories in Sanity.
 * One-time script for translation sweep.
 *
 * Usage: node scripts/update-nav-translations.mjs [--dry-run]
 */

import "./load-env.mjs";
import { createClient } from "@sanity/client";

const dryRun = process.argv.includes("--dry-run");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

// ── Category label updates ──────────────────────────────────────────
const categoryUpdates = {
  "category-shien": "Resident Support",
  "category-kehatsu": "Education & Awareness",
  // "category-kouryu": "Cultural Exchange",  // no change
  "category-kokusaikoken": "Global Outreach",
  // "category-about": "About YIA",  // no change
};

// ── Navigation item title updates ───────────────────────────────────
// These are stored inside navigation.categories[].items[].title
const navItemUpdates = {
  seikatsusodan: "Multilingual Counseling",
  kaiwasalon: "Japanese Conversation Salon",
  // honyaku: no change
  // bosai: no change
  "nihongo-handbook": "Japanese Study & Living Guide",
  gaikokugo: "Foreign Language Classes",
  kokusairikai: "Cross-Cultural Seminars",
  youthfo: "International Youth Forum",
  nihonbunka: "Japanese Culture & JFY",
  // kids: no change
  englishguide: "English Guided Tours",
  // homestay: no change
  cooking: "International Cooking Class",
  kokusaikoken: "Global Outreach Programs",
  sistercity: "Sister City Student Exchange",
  aboutyia: "Organization Overview",
  kaiinn: "Become a Member",
  sanjyokaiin: "Corporate Sponsors",
};

async function updateCategories() {
  console.log("── Updating category labels ──\n");

  for (const [docId, newEn] of Object.entries(categoryUpdates)) {
    const doc = await client.fetch(`*[_id == $id][0]{ _id, label }`, { id: docId });
    if (!doc) {
      console.warn(`  ⚠ Category ${docId} not found`);
      continue;
    }

    const oldEn = doc.label?.find((l) => l._key === "en")?.value;
    console.log(`  ${docId}: "${oldEn}" → "${newEn}"`);

    if (dryRun) continue;

    const newLabel = doc.label.map((l) =>
      l._key === "en" ? { ...l, value: newEn } : l
    );
    await client.patch(docId).set({ label: newLabel }).commit();
  }
}

async function updateNavItems() {
  console.log("\n── Updating navigation item titles ──\n");

  const nav = await client.fetch(`*[_type == "navigation"][0]`);
  if (!nav) {
    console.error("Navigation document not found!");
    return;
  }

  let changed = false;
  const newCategories = nav.categories.map((cat) => {
    const newItems = cat.items.map((item) => {
      const newEn = navItemUpdates[item.id];
      if (!newEn) return item;

      const oldEn = item.title?.find((t) => t._key === "en")?.value;
      console.log(`  ${item.id}: "${oldEn}" → "${newEn}"`);

      changed = true;
      const newTitle = item.title.map((t) =>
        t._key === "en" ? { ...t, value: newEn } : t
      );
      return { ...item, title: newTitle };
    });
    return { ...cat, items: newItems };
  });

  // Also update orgLinks (footer links)
  const newOrgLinks = nav.orgLinks.map((link) => {
    const newEn = navItemUpdates[link.id];
    if (!newEn) return link;

    const oldEn = link.title?.find((t) => t._key === "en")?.value;
    console.log(`  orgLink ${link.id}: "${oldEn}" → "${newEn}"`);

    changed = true;
    const newTitle = link.title.map((t) =>
      t._key === "en" ? { ...t, value: newEn } : t
    );
    return { ...link, title: newTitle };
  });

  if (changed && !dryRun) {
    await client
      .patch(nav._id)
      .set({ categories: newCategories, orgLinks: newOrgLinks })
      .commit();
    console.log("\n  ✓ Navigation document patched");
  }
}

async function main() {
  console.log(dryRun ? "🔍 DRY RUN — no changes will be made\n" : "🔄 Updating translations...\n");

  await updateCategories();
  await updateNavItems();

  console.log("\n✅ Done!");
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
