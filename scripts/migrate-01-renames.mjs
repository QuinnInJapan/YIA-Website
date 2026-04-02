/**
 * Migration 01: Simple _type renames
 *
 * infoTable      → labelTable
 * definitions    → infoCards
 * sisterCities   → imageCards  (+ renames .cities → .items)
 *
 * Run:
 *   export SANITY_TOKEN=<token> && node scripts/migrate-01-renames.mjs
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

const RENAMES = [
  { from: "infoTable", to: "labelTable" },
  { from: "definitions", to: "infoCards" },
];

async function renameSections() {
  let patchCount = 0;

  for (const { from, to } of RENAMES) {
    const pages = await client.fetch(
      `*[_type == "page" && defined(sections)]{
        _id,
        "sections": sections[_type == "${from}"]{_key}
      }[count(sections) > 0]`,
    );

    for (const page of pages) {
      for (const sec of page.sections) {
        console.log(`${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: ${from}[${sec._key}] → ${to}`);
        if (!DRY_RUN) {
          await client
            .patch(page._id)
            .set({ [`sections[_key=="${sec._key}"]._type`]: to })
            .commit();
          patchCount++;
        }
      }
    }
  }

  return patchCount;
}

async function renameSisterCities() {
  let patchCount = 0;

  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      "sections": sections[_type == "sisterCities"]{_key, cities}
    }[count(sections) > 0]`,
  );

  for (const page of pages) {
    for (const sec of page.sections) {
      console.log(
        `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: sisterCities[${sec._key}] → imageCards (cities → items)`,
      );
      if (!DRY_RUN) {
        await client
          .patch(page._id)
          .set({
            [`sections[_key=="${sec._key}"]._type`]: "imageCards",
            [`sections[_key=="${sec._key}"].items`]: sec.cities ?? [],
          })
          .unset([`sections[_key=="${sec._key}"].cities`])
          .commit();
        patchCount++;
      }
    }
  }

  return patchCount;
}

async function main() {
  const r1 = await renameSections();
  const r2 = await renameSisterCities();
  console.log(`\nDone. ${DRY_RUN ? "Would patch" : "Patched"} ${r1 + r2} section(s).`);
}

main().catch(console.error);
