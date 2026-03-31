/**
 * Seed the homepageFeatured singleton from existing navigation data.
 *
 * Usage: npx tsx scripts/seed-homepage-featured.ts
 *
 * Populates 4 slots using the first 4 categories from navigation,
 * with up to 4 pages per slot from the navigation items.
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
  // Check if document already exists
  const existing = await client.fetch(`*[_type == "homepageFeatured"][0]._id`);
  if (existing) {
    console.log("homepageFeatured document already exists — skipping seed.");
    return;
  }

  // Fetch navigation with dereferenced categories and pages
  const nav = await client.fetch(`*[_type == "navigation"][0]{
    categories[]{
      categoryRef->{ _id },
      items[]{ pageRef->{ _id } }
    }
  }`);

  if (!nav?.categories?.length) {
    console.error("No navigation categories found — cannot seed.");
    process.exit(1);
  }

  const cats = nav.categories.slice(0, 4);

  if (cats.length < 4) {
    console.warn(`Only ${cats.length} categories found — need 4 for full seeding.`);
  }

  // Build the document
  const doc: Record<string, unknown> = {
    _id: "homepageFeatured",
    _type: "homepageFeatured",
  };

  cats.forEach((cat: any, i: number) => {
    const slotKey = `slot${i + 1}`;
    const pages = (cat.items ?? [])
      .slice(0, 4)
      .filter((item: any) => item.pageRef?._id)
      .map((item: any) => ({
        _type: "reference",
        _ref: item.pageRef._id,
        _key: item.pageRef._id,
      }));

    doc[slotKey] = {
      _type: "object",
      categoryRef: {
        _type: "reference",
        _ref: cat.categoryRef._id,
      },
      pages,
    };
  });

  await client.createOrReplace(doc);
  console.log("homepageFeatured document created with slots:");
  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i];
    const pageCount = (cat.items ?? []).slice(0, 4).filter((it: any) => it.pageRef?._id).length;
    console.log(`  slot${i + 1}: ${cat.categoryRef._id} (${pageCount} pages)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
