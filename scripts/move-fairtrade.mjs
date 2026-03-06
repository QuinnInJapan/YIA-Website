/**
 * Move the fairTrade section from the cooking page to the kokusaikoken page.
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/move-fairtrade.mjs
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
  const cooking = await client.fetch(
    `*[_type == "page" && slug == "cooking"][0]{ _id, sections }`
  );
  const kokusaikoken = await client.fetch(
    `*[_type == "page" && slug == "kokusaikoken"][0]{ _id, sections }`
  );

  if (!cooking || !kokusaikoken) {
    throw new Error("Could not find cooking or kokusaikoken page");
  }

  const ftIndex = cooking.sections.findIndex((s) => s._type === "fairTrade");
  if (ftIndex === -1) {
    console.log("No fairTrade section found on cooking page. Nothing to do.");
    return;
  }

  const fairTradeSection = cooking.sections[ftIndex];
  const newCookingSections = cooking.sections.filter((_, i) => i !== ftIndex);
  const newKokusaiSections = [...(kokusaikoken.sections || []), fairTradeSection];

  const ftTitle = fairTradeSection.title?.find((t) => t._key === "ja")?.value;
  console.log(`\nMoving "${ftTitle}" from cooking → kokusaikoken`);
  console.log(`  cooking: ${cooking.sections.length} sections → ${newCookingSections.length}`);
  console.log(`  kokusaikoken: ${(kokusaikoken.sections || []).length} sections → ${newKokusaiSections.length}`);

  if (DRY_RUN) {
    console.log("\n[DRY RUN] No changes written.\n");
    return;
  }

  const tx = client.transaction();
  tx.patch(cooking._id, { set: { sections: newCookingSections } });
  tx.patch(kokusaikoken._id, { set: { sections: newKokusaiSections } });

  const result = await tx.commit();
  console.log(`\nDone. Transaction ID: ${result.transactionId}\n`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
