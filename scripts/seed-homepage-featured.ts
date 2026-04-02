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

  const catIds = (nav.categories as { categoryRef?: { _id: string } }[])
    .map((c) => c.categoryRef?._id)
    .filter((id): id is string => !!id && !id.includes("about"))
    .slice(0, 4);

  if (catIds.length < 4) {
    console.warn(`Only ${catIds.length} categories found — need 4 for full seeding.`);
  }

  const categories = catIds.map((ref) => ({
    _type: "reference" as const,
    _ref: ref,
    _key: ref,
  }));

  await client.createOrReplace({
    _id: "homepageFeatured",
    _type: "homepageFeatured",
    categories,
  });

  console.log(`homepageFeatured seeded with ${categories.length} categories:`);
  catIds.forEach((id) => console.log(`  ${id}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
