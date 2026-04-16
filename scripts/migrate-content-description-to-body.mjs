/**
 * Migrate content sections: rename description → body, converting plain text
 * to internationalizedArrayBlockContent (Portable Text).
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | grep '=' | xargs)
 *   node scripts/migrate-content-description-to-body.mjs
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

function randomKey() {
  return Math.random().toString(36).slice(2, 14);
}

/** Convert a plain text string to a Portable Text block array */
function textToBlocks(text) {
  if (!text?.trim()) return [];
  return text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => ({
      _type: "block",
      _key: randomKey(),
      style: "normal",
      children: [{ _type: "span", _key: randomKey(), text: line, marks: [] }],
      markDefs: [],
    }));
}

/** Convert an internationalizedArrayText field to internationalizedArrayBlockContent */
function convertDescriptionToBody(descriptionField) {
  if (!Array.isArray(descriptionField)) return null;
  return descriptionField.map((entry) => ({
    _key: entry._key,
    _type: entry._type,
    value: typeof entry.value === "string" ? textToBlocks(entry.value) : entry.value,
  }));
}

async function main() {
  if (DRY_RUN) console.log("🔍 DRY RUN — no changes will be written\n");

  const pages = await client.fetch(
    `*[_type == "page" && count(sections[_type == "content" && defined(description)]) > 0]{
      _id, slug, title, sections
    }`,
  );

  console.log(`Found ${pages.length} page(s) with content sections to migrate\n`);

  let patchCount = 0;

  for (const page of pages) {
    const pageTitle = page.title?.[0]?.value || page.slug || page._id;
    const sections = JSON.parse(JSON.stringify(page.sections));
    let modified = false;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section._type !== "content" || !section.description) continue;

      sections[i] = {
        ...section,
        body: convertDescriptionToBody(section.description),
      };
      delete sections[i].description;
      modified = true;
    }

    if (modified) {
      patchCount++;
      console.log(`📝 ${pageTitle}`);

      if (!DRY_RUN) {
        await client.patch(page._id).set({ sections }).commit();
        console.log(`   ✅ saved`);
      }
    }
  }

  console.log(`\n${DRY_RUN ? "Would patch" : "Patched"} ${patchCount} document(s).`);
}

main().catch(console.error);
