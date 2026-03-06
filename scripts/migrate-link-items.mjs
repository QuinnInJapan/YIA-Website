/**
 * Migration: Convert linkItem → documentLink in linksSection items
 *
 * Changes:
 * - _type: "linkItem" → "documentLink"
 * - title → label
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/migrate-link-items.mjs
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

async function main() {
  // Find all pages with links sections containing linkItem types
  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      sections[_type == "links"]{
        _key,
        items
      }
    }[count(sections) > 0]`
  );

  let patchCount = 0;

  for (const page of pages) {
    for (const section of page.sections) {
      if (!section.items?.length) continue;

      let needsPatch = false;
      const updatedItems = section.items.map((item) => {
        // Already migrated
        if (item._type === "documentLink") return item;
        if (item._type !== "linkItem") return item;

        needsPatch = true;
        const { title, _type, ...rest } = item;
        return {
          ...rest,
          _type: "documentLink",
          label: title,
        };
      });

      if (!needsPatch) continue;

      console.log(`${DRY_RUN ? "[DRY RUN] " : ""}Patching ${page._id}, section ${section._key}:`);
      for (const item of updatedItems) {
        const label = item.label?.find((e) => e._key === "ja")?.value || "?";
        console.log(`  ${item._type}: ${label}`);
      }

      if (!DRY_RUN) {
        await client
          .patch(page._id)
          .set({
            [`sections[_key=="${section._key}"].items`]: updatedItems,
          })
          .commit();
        patchCount++;
      }
    }
  }

  console.log(`\nDone. ${DRY_RUN ? "Would patch" : "Patched"} ${patchCount} section(s).`);
}

main().catch(console.error);
