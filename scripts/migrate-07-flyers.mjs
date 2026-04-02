/**
 * Migration 07: Delete flyers sections
 *
 * flyers has 0 production uses per spec. This script removes any instances
 * found (none expected) to clean up for schema removal.
 *
 * Run:
 *   export SANITY_TOKEN=<token> && node scripts/migrate-07-flyers.mjs
 *   Add --dry-run to preview without writing.
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
  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      "sections": sections[_type == "flyers"]{_key}
    }[count(sections) > 0]`,
  );

  let patchCount = 0;

  for (const page of pages) {
    for (const sec of page.sections) {
      console.log(`${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: delete flyers[${sec._key}]`);
      if (!DRY_RUN) {
        await client
          .patch(page._id)
          .unset([`sections[_key=="${sec._key}"]`])
          .commit();
        patchCount++;
      }
    }
  }

  if (pages.length === 0) {
    console.log("No flyers sections found. Nothing to do.");
  }

  console.log(`\nDone. ${DRY_RUN ? "Would delete" : "Deleted"} ${patchCount} section(s).`);
}

main().catch(console.error);
