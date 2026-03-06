/**
 * Sync script: Set categoryRef on pages from navigation document
 *
 * The navigation document is the single source of truth for which pages
 * belong to which categories. This script reads navigation, resolves each
 * item's pageRef, and patches the page with the correct categoryRef.
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && npx tsx scripts/sync-nav-categories.ts
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

interface NavItem {
  pageRef?: { _ref: string };
}

interface NavCategory {
  categoryRef?: { _ref: string };
  items?: NavItem[];
}

interface NavDoc {
  _id: string;
  categories?: NavCategory[];
}

interface PageDoc {
  _id: string;
  title?: { _key: string; value: string }[];
  categoryRef?: { _ref: string };
}

async function sync() {
  const nav: NavDoc | null = await client.fetch(`*[_type == "navigation"][0]`);
  if (!nav?.categories) {
    console.error("No navigation document found");
    process.exit(1);
  }

  // Build mapping: pageRef._ref → categoryRef._ref
  const pageToCat: Map<string, string> = new Map();
  for (const cat of nav.categories) {
    const catRef = cat.categoryRef?._ref;
    if (!catRef) continue;
    for (const item of cat.items ?? []) {
      const pageRef = item.pageRef?._ref;
      if (pageRef) {
        pageToCat.set(pageRef, catRef);
      }
    }
  }

  // Fetch all pages to compare current categoryRef
  const pages: PageDoc[] = await client.fetch(
    `*[_type == "page"]{ _id, title, categoryRef }`
  );

  const updates: { pageId: string; title: string; oldCat: string; newCat: string }[] = [];

  for (const page of pages) {
    const expectedCat = pageToCat.get(page._id);
    if (!expectedCat) continue; // page not in navigation — skip

    const currentCat = page.categoryRef?._ref;
    if (currentCat === expectedCat) continue; // already correct

    const title = page.title?.find((t) => t._key === "ja")?.value ?? page._id;
    updates.push({
      pageId: page._id,
      title,
      oldCat: currentCat ?? "(none)",
      newCat: expectedCat,
    });
  }

  if (updates.length === 0) {
    console.log("All pages already have correct categoryRef. Nothing to do.");
    return;
  }

  console.log(`\n${updates.length} page(s) need categoryRef update:\n`);
  for (const u of updates) {
    console.log(`  ${u.title} (${u.pageId})`);
    console.log(`    ${u.oldCat} → ${u.newCat}`);
  }

  if (DRY_RUN) {
    console.log("\n[DRY RUN] No changes written.\n");
    return;
  }

  const tx = client.transaction();
  for (const u of updates) {
    tx.patch(u.pageId, {
      set: { categoryRef: { _type: "reference", _ref: u.newCat } },
    });
  }

  const result = await tx.commit();
  console.log(`\nSync complete. Transaction ID: ${result.transactionId}`);
  console.log(`Updated ${updates.length} page(s).\n`);
}

sync().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
