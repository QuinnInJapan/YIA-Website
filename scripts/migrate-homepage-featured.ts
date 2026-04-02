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
