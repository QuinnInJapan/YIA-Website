/**
 * Migration: Rename category IDs + convert page category to reference
 *
 * Category ID renames:
 *   shien       → support   (生活サポート / Living Support)
 *   kehatsu     → learning  (語学・講座 / Language & Classes)
 *   kouryu      → events    (イベント / Events)
 *   kokusaikoken → exchange  (国際交流 / Global Exchange)
 *   about       → about     (unchanged)
 *
 * Also converts page `category` string field → `categoryRef` reference.
 * Also moves fairTrade section from cooking page to exchange (formerly kokusaikoken) page.
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/rename-categories.mjs
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

// ── ID mapping ──────────────────────────────────────────────────

const idMap = {
  shien: "support",
  kehatsu: "learning",
  kouryu: "events",
  kokusaikoken: "exchange",
  about: "about", // unchanged
};

const categoryDocMap = Object.fromEntries(
  Object.entries(idMap).map(([old, neu]) => [`category-${old}`, `category-${neu}`])
);

// ── Step 1: Rename category documents ───────────────────────────

async function renameCategories(tx) {
  console.log("\n=== Step 1: Rename category documents ===");

  for (const [oldId, newId] of Object.entries(categoryDocMap)) {
    if (oldId === newId) {
      console.log(`  ${oldId}: unchanged, skipping`);
      continue;
    }

    const doc = await client.fetch(`*[_id == $id][0]`, { id: oldId });
    if (!doc) {
      console.log(`  ${oldId}: not found, skipping`);
      continue;
    }

    const newDocId = newId;
    const newFieldId = idMap[doc.id] || doc.id;

    console.log(`  ${oldId} → ${newDocId} (id field: ${doc.id} → ${newFieldId})`);

    if (!DRY_RUN) {
      // Create new document with new _id
      tx.createOrReplace({
        ...doc,
        _id: newDocId,
        id: newFieldId,
      });
      // Delete old published document
      tx.delete(oldId);
      // Delete old draft if it exists
      const draft = await client.fetch(`*[_id == $id][0]`, { id: `drafts.${oldId}` });
      if (draft) {
        tx.delete(`drafts.${oldId}`);
      }
    }
  }
}

// ── Step 2: Update navigation references ────────────────────────

async function updateNavigation(tx) {
  console.log("\n=== Step 2: Update navigation references ===");

  const nav = await client.fetch(`*[_type == "navigation"][0]`);
  if (!nav) {
    console.log("  No navigation document found, skipping");
    return;
  }

  let changed = false;
  const updatedCategories = nav.categories.map((cat) => {
    const oldRef = cat.categoryRef?._ref;
    const newRef = categoryDocMap[oldRef];
    if (newRef && newRef !== oldRef) {
      console.log(`  nav categoryRef: ${oldRef} → ${newRef}`);
      changed = true;
      return {
        ...cat,
        categoryRef: { ...cat.categoryRef, _ref: newRef },
      };
    }
    return cat;
  });

  if (changed && !DRY_RUN) {
    tx.patch(nav._id, { set: { categories: updatedCategories } });
  }
  if (!changed) {
    console.log("  No navigation changes needed");
  }
}

// ── Step 3: Convert page category string → categoryRef reference ─

async function convertPageCategories(tx) {
  console.log("\n=== Step 3: Convert page category → categoryRef ===");

  const pages = await client.fetch(
    `*[_type == "page" && defined(category)]{ _id, slug, category }`
  );

  if (!pages.length) {
    console.log("  No pages with category field found");
    return;
  }

  for (const page of pages) {
    const oldCat = page.category;
    const newId = idMap[oldCat];
    if (!newId) {
      console.log(`  ${page.slug}: unknown category "${oldCat}", skipping`);
      continue;
    }

    const newRef = `category-${newId}`;
    console.log(`  ${page.slug}: category "${oldCat}" → categoryRef { _ref: "${newRef}" }`);

    if (!DRY_RUN) {
      tx.patch(page._id, {
        set: { categoryRef: { _ref: newRef, _type: "reference" } },
        unset: ["category"],
      });
    }
  }
}

// ── Step 4: Move fairTrade section from cooking → exchange ──────

async function moveFairTrade(tx) {
  console.log("\n=== Step 4: Move fairTrade section ===");

  const cooking = await client.fetch(
    `*[_type == "page" && slug == "cooking"][0]{ _id, sections }`
  );
  const exchange = await client.fetch(
    `*[_type == "page" && slug == "kokusaikoken"][0]{ _id, sections }`
  );

  if (!cooking || !exchange) {
    console.log("  Could not find cooking or kokusaikoken page, skipping");
    return;
  }

  const ftIndex = cooking.sections?.findIndex((s) => s._type === "fairTrade") ?? -1;
  if (ftIndex === -1) {
    console.log("  No fairTrade section found on cooking page, skipping");
    return;
  }

  const fairTradeSection = cooking.sections[ftIndex];
  const newCookingSections = cooking.sections.filter((_, i) => i !== ftIndex);
  const newExchangeSections = [...(exchange.sections || []), fairTradeSection];

  const ftTitle = fairTradeSection.title?.find((t) => t._key === "ja")?.value;
  console.log(`  Moving "${ftTitle}" from cooking → kokusaikoken (exchange)`);
  console.log(`  cooking: ${cooking.sections.length} → ${newCookingSections.length} sections`);
  console.log(`  kokusaikoken: ${(exchange.sections || []).length} → ${newExchangeSections.length} sections`);

  if (!DRY_RUN) {
    tx.patch(cooking._id, { set: { sections: newCookingSections } });
    tx.patch(exchange._id, { set: { sections: newExchangeSections } });
  }
}

// ── Run ─────────────────────────────────────────────────────────

async function migrate() {
  console.log(DRY_RUN ? "\n[DRY RUN MODE]\n" : "\n[LIVE MODE]\n");

  const tx = client.transaction();

  await renameCategories(tx);
  await updateNavigation(tx);
  await convertPageCategories(tx);
  await moveFairTrade(tx);

  if (DRY_RUN) {
    console.log("\n[DRY RUN] No changes written.\n");
    return;
  }

  const result = await tx.commit();
  console.log(`\nMigration complete. Transaction ID: ${result.transactionId}\n`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
