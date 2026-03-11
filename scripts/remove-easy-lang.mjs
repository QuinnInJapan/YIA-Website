/**
 * Remove all "easy" (やさしい日本語) language entries from Sanity documents.
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | grep '=' | xargs)
 *   node scripts/remove-easy-lang.mjs
 *
 * Add --dry-run to preview changes without writing.
 */

import { createClient } from "@sanity/client";

const DRY_RUN = process.argv.includes("--dry-run");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

/** Recursively remove entries with _key === "easy" from i18n arrays */
function stripEasy(obj) {
  if (obj == null || typeof obj !== "object") return [obj, false];

  if (Array.isArray(obj)) {
    const before = obj.length;
    // Filter out i18n entries with _key === "easy"
    const filtered = obj.filter(
      (item) => !(item && typeof item === "object" && item._key === "easy"),
    );
    let changed = filtered.length !== before;

    // Recurse into remaining items
    const result = filtered.map((item) => {
      const [cleaned, itemChanged] = stripEasy(item);
      if (itemChanged) changed = true;
      return cleaned;
    });
    return [result, changed];
  }

  let changed = false;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("_")) {
      result[key] = value;
      continue;
    }
    const [cleaned, fieldChanged] = stripEasy(value);
    result[key] = cleaned;
    if (fieldChanged) changed = true;
  }
  return [result, changed];
}

async function main() {
  if (DRY_RUN) console.log("🔍 DRY RUN — no changes will be written\n");

  // Fetch all document types that use i18n fields
  const types = ["page", "announcement", "blogPost", "homepage", "siteSettings", "navigation", "sidebar", "category"];
  const docs = await client.fetch(
    `*[_type in $types]`,
    { types },
  );

  console.log(`Found ${docs.length} documents\n`);
  let patchCount = 0;

  for (const doc of docs) {
    const [cleaned, changed] = stripEasy(doc);
    if (!changed) continue;

    patchCount++;
    const label = doc.title?.[0]?.value || doc.slug || doc._id;
    console.log(`📝 [${doc._type}] ${label}`);

    if (!DRY_RUN) {
      // Replace entire document content (excluding system fields)
      const patch = {};
      for (const [key, value] of Object.entries(cleaned)) {
        if (key.startsWith("_")) continue;
        patch[key] = value;
      }
      await client.patch(doc._id).set(patch).commit();
      console.log(`   ✅ saved`);
    }
  }

  console.log(`\n${DRY_RUN ? "Would patch" : "Patched"} ${patchCount} document(s).`);
}

main().catch(console.error);
