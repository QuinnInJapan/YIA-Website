/**
 * Migrate block content fields to plain text strings.
 *
 * Converts internationalizedArrayBlockContent → internationalizedArrayText
 * for fields that don't use rich formatting.
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | grep '=' | xargs)
 *   node scripts/migrate-block-to-text.mjs
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

/** Convert a portable text block array to plain text */
function blocksToText(blocks) {
  if (!Array.isArray(blocks)) return "";
  return blocks
    .filter((b) => b._type === "block")
    .map((b) =>
      (b.children || [])
        .map((c) => c.text || "")
        .join("")
    )
    .join("\n");
}

/** Convert an i18n block array to i18n string array */
function convertI18nField(i18nArray) {
  if (!Array.isArray(i18nArray)) return null;

  return i18nArray.map((entry) => ({
    _key: entry._key,
    _type: entry._type,
    value: typeof entry.value === "string" ? entry.value : blocksToText(entry.value),
  }));
}

async function main() {
  if (DRY_RUN) console.log("🔍 DRY RUN — no changes will be written\n");

  const pages = await client.fetch(`*[_type == "page"]{
    _id, slug, title,
    description,
    sections
  }`);

  console.log(`Found ${pages.length} pages\n`);

  let patchCount = 0;

  for (const page of pages) {
    const pageTitle = page.title?.[0]?.value || page.slug || page._id;
    const patches = {};

    // page.description
    if (page.description && Array.isArray(page.description)) {
      const first = page.description[0];
      if (first?.value && typeof first.value !== "string") {
        patches.description = convertI18nField(page.description);
      }
    }

    // Sections
    if (page.sections) {
      let sectionsModified = false;
      const sections = JSON.parse(JSON.stringify(page.sections)); // deep clone

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];

        if (section._type === "content") {
          if (section.description?.[0]?.value && typeof section.description[0].value !== "string") {
            sections[i].description = convertI18nField(section.description);
            sectionsModified = true;
          }
          if (section.note?.[0]?.value && typeof section.note[0].value !== "string") {
            sections[i].note = convertI18nField(section.note);
            sectionsModified = true;
          }
        }

        if (section._type === "warnings" && section.items) {
          let itemsModified = false;
          for (let j = 0; j < section.items.length; j++) {
            const item = section.items[j];
            if (Array.isArray(item)) {
              const first = item[0];
              if (first?.value && typeof first.value !== "string") {
                sections[i].items[j] = convertI18nField(item);
                itemsModified = true;
              }
            }
          }
          if (itemsModified) sectionsModified = true;
        }

        if (section._type === "history") {
          if (section.intro?.[0]?.value && typeof section.intro[0].value !== "string") {
            sections[i].intro = convertI18nField(section.intro);
            sectionsModified = true;
          }
        }

        if (section._type === "fairTrade") {
          if (section.description?.[0]?.value && typeof section.description[0].value !== "string") {
            sections[i].description = convertI18nField(section.description);
            sectionsModified = true;
          }
          if (section.delivery?.[0]?.value && typeof section.delivery[0].value !== "string") {
            sections[i].delivery = convertI18nField(section.delivery);
            sectionsModified = true;
          }
        }
      }

      if (sectionsModified) {
        patches.sections = sections;
      }
    }

    if (Object.keys(patches).length > 0) {
      patchCount++;
      console.log(`📝 ${pageTitle}: patching ${Object.keys(patches).join(", ")}`);

      if (!DRY_RUN) {
        await client
          .patch(page._id)
          .set(patches)
          .commit();
        console.log(`   ✅ saved`);
      }
    }
  }

  console.log(`\n${DRY_RUN ? "Would patch" : "Patched"} ${patchCount} document(s).`);
}

main().catch(console.error);
