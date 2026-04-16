/**
 * Remove the `subtitle` field from all page documents (published + drafts).
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/remove-subtitle-field.mjs
 */

import { createClient } from "next-sanity";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

async function main() {
  const docs = await client.fetch(
    `*[_type == "page" && defined(subtitle)]{ _id, subtitle }`
  );

  if (docs.length === 0) {
    console.log("No page documents with subtitle found.");
    return;
  }

  console.log(`Found ${docs.length} document(s) with subtitle. Removing...`);

  for (const doc of docs) {
    await client.patch(doc._id).unset(["subtitle"]).commit();
    console.log(`  unset subtitle on ${doc._id}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
