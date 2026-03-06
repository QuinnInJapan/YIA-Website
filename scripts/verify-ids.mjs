/**
 * Verification: Check that _id matches the {type}-{id} pattern for all documents
 * that previously had custom id fields.
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/verify-ids.mjs
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
  const types = ["category", "page", "announcement"];
  let issues = 0;

  for (const type of types) {
    const docs = await client.fetch(
      `*[_type == $type]{ _id, id, slug }`,
      { type }
    );

    console.log(`\n=== ${type} (${docs.length} docs) ===`);

    for (const doc of docs) {
      const expectedPrefix = `${type}-`;
      const hasPrefix = doc._id.startsWith(expectedPrefix);
      const suffix = hasPrefix ? doc._id.slice(expectedPrefix.length) : null;
      const idMatch = doc.id ? suffix === doc.id : true;

      if (!hasPrefix) {
        console.log(`  ⚠️  ${doc._id} — missing ${expectedPrefix} prefix`);
        issues++;
      } else if (!idMatch) {
        console.log(`  ⚠️  ${doc._id} — _id suffix "${suffix}" ≠ id field "${doc.id}"`);
        issues++;
      } else {
        console.log(`  ✓  ${doc._id}${doc.id ? ` (id: ${doc.id})` : ""}`);
      }
    }
  }

  console.log(`\n${issues === 0 ? "✅ All IDs consistent." : `⚠️  ${issues} issue(s) found.`}`);
}

main().catch(console.error);
