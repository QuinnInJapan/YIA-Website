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

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_TOKEN;

if (!projectId || !dataset || !token) {
  console.error(
    "Missing required env vars: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_TOKEN",
  );
  console.error("Ensure .env.local is present with these values.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token,
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

  // NOTE: The old slots also contained a `pages` sub-array (manually curated page links).
  // These are intentionally NOT migrated — pages are now derived automatically from
  // navigation data. The pages[] data is obsolete and safe to discard.
  const slotRefs = ["slot1", "slot2", "slot3", "slot4"]
    .map((key) => doc[key]?.categoryRef?._ref)
    .filter(Boolean) as string[];

  if (slotRefs.length === 0) {
    console.warn("No slot categoryRefs found — nothing to migrate. Document may be empty.");
    return;
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
