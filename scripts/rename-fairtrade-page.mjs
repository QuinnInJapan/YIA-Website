/**
 * Migration: Rename kokusaikoken page → fairtrade and consolidate content
 *
 * - Rename page title, slug, id
 * - Promote the detailed Nepal coffee description to page-level description
 * - Remove redundant content section (keep only the fairTrade section)
 * - Update nav entry title and id
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/rename-fairtrade-page.mjs
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

async function migrate() {
  console.log(DRY_RUN ? "\n[DRY RUN MODE]\n" : "\n[LIVE MODE]\n");

  // ── Fetch page ──────────────────────────────────────────────────

  const page = await client.fetch(
    `*[_type == "page" && slug == "kokusaikoken"][0]`
  );
  if (!page) throw new Error("kokusaikoken page not found");

  // The detailed Nepal coffee paragraph from the content section
  const contentSection = page.sections.find((s) => s._type === "content");
  const fairTradeSection = page.sections.find((s) => s._type === "fairTrade");

  if (!fairTradeSection) throw new Error("No fairTrade section found");

  // Use the content section's detailed Japanese description as the page description,
  // keep the existing English page description (it's already good)
  const newDescription = [];
  if (contentSection?.description) {
    const jaDesc = contentSection.description.find((d) => d._key === "ja");
    if (jaDesc) newDescription.push(jaDesc);
  }
  const existingEnDesc = page.description?.find((d) => d._key === "en");
  if (existingEnDesc) newDescription.push(existingEnDesc);

  const newTitle = [
    { _key: "ja", value: "フェアトレードコーヒー" },
    { _key: "en", value: "Fair Trade Coffee" },
    { _key: "easy", value: "フェアトレードコーヒー" },
  ];

  console.log("=== Page rename ===");
  console.log(`  title: ${page.title.find((t) => t._key === "ja")?.value} → ${newTitle.find((t) => t._key === "ja")?.value}`);
  console.log(`  slug: kokusaikoken → fairtrade`);
  console.log(`  id: kokusaikoken → fairtrade`);
  console.log(`  sections: ${page.sections.length} → 1 (keeping fairTrade only)`);
  console.log(`  description: promoted detailed paragraph from content section`);

  // ── Fetch nav ───────────────────────────────────────────────────

  const nav = await client.fetch(`*[_type == "navigation"][0]`);
  if (!nav) throw new Error("Navigation document not found");

  // Find the exchange category and update the kokusaikoken nav item
  let navUpdated = false;
  const updatedCategories = nav.categories.map((cat) => {
    if (cat.categoryRef?._ref !== "category-exchange") return cat;
    return {
      ...cat,
      items: cat.items.map((item) => {
        if (item.id !== "kokusaikoken") return item;
        navUpdated = true;
        return {
          ...item,
          id: "fairtrade",
          title: [
            { _key: "ja", value: "フェアトレードコーヒー" },
            { _key: "en", value: "Fair Trade Coffee" },
          ],
        };
      }),
    };
  });

  console.log("\n=== Nav update ===");
  if (navUpdated) {
    console.log(`  exchange → kokusaikoken renamed to fairtrade`);
  } else {
    console.log(`  kokusaikoken nav item not found, skipping`);
  }

  if (DRY_RUN) {
    console.log("\n[DRY RUN] No changes written.\n");
    return;
  }

  // ── Commit ──────────────────────────────────────────────────────

  const tx = client.transaction();

  tx.patch(page._id, {
    set: {
      title: newTitle,
      slug: "fairtrade",
      id: "fairtrade",
      description: newDescription,
      sections: [fairTradeSection],
    },
  });

  if (navUpdated) {
    tx.patch(nav._id, { set: { categories: updatedCategories } });
  }

  const result = await tx.commit();
  console.log(`\nMigration complete. Transaction ID: ${result.transactionId}\n`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
