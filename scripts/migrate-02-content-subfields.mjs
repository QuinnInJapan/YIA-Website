/**
 * Migration 02: Extract content section sub-fields into sibling sections
 *
 * For each content section, any populated sub-fields are converted to
 * standalone sections inserted immediately after the content section.
 *
 * Sub-field → section type mapping:
 *   infoTable  → labelTable (rows copied directly)
 *   checklist  → labelTable (item.label → row.value, empty row.label)
 *   documents  → links      (documents array copied as items)
 *   images     → gallery    (images array copied directly)
 *   schedule   → labelTable (city→label, period→value)
 *   note       → warnings   (note value wrapped as single item)
 *
 * Run:
 *   export SANITY_TOKEN=<token> && node scripts/migrate-02-content-subfields.mjs
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

function randomKey() {
  return crypto.randomUUID().slice(0, 12);
}

function buildSiblings(sec) {
  const siblings = [];
  const order = ["infoTable", "checklist", "schedule", "documents", "images", "note"];

  for (const field of order) {
    if (!sec[field] || (Array.isArray(sec[field]) && sec[field].length === 0)) continue;

    if (field === "infoTable") {
      siblings.push({
        _type: "labelTable",
        _key: randomKey(),
        hideTitle: true,
        rows: sec.infoTable,
      });
    }

    if (field === "checklist") {
      const rows = sec.checklist.map((item) => ({
        _key: randomKey(),
        label: [
          { _key: "ja", value: "" },
          { _key: "en", value: "" },
        ],
        value: item.label,
      }));
      siblings.push({
        _type: "labelTable",
        _key: randomKey(),
        hideTitle: true,
        rows,
      });
    }

    if (field === "schedule") {
      const rows = sec.schedule.map((entry) => ({
        _key: randomKey(),
        label: [
          { _key: "ja", value: entry.city },
          { _key: "en", value: entry.city },
        ],
        value: [
          { _key: "ja", value: entry.period },
          { _key: "en", value: entry.period },
        ],
      }));
      siblings.push({
        _type: "labelTable",
        _key: randomKey(),
        hideTitle: true,
        rows,
      });
    }

    if (field === "documents") {
      siblings.push({
        _type: "links",
        _key: randomKey(),
        hideTitle: true,
        items: sec.documents,
      });
    }

    if (field === "images") {
      siblings.push({
        _type: "gallery",
        _key: randomKey(),
        images: sec.images,
      });
    }

    if (field === "note") {
      siblings.push({
        _type: "warnings",
        _key: randomKey(),
        items: [{ _key: randomKey(), value: sec.note }],
      });
    }
  }

  return siblings;
}

async function main() {
  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      sections[_type == "content"]{
        _key,
        infoTable,
        checklist,
        schedule,
        documents,
        images,
        note
      }
    }[count(sections) > 0]`,
  );

  let patchCount = 0;

  for (const page of pages) {
    // Fetch the full sections array for this page to know insertion indices
    const fullPage = await client.fetch(
      `*[_type == "page" && _id == $id][0]{ sections[]{_key, _type} }`,
      { id: page._id },
    );

    const allSections = fullPage.sections ?? [];

    // Process in reverse order so insertion indices don't shift
    const contentSections = page.sections
      .filter((sec) => {
        const hasSubFields =
          sec.infoTable?.length ||
          sec.checklist?.length ||
          sec.schedule?.length ||
          sec.documents?.length ||
          sec.images?.length ||
          sec.note;
        return hasSubFields;
      })
      .reverse();

    for (const sec of contentSections) {
      const siblings = buildSiblings(sec);
      if (!siblings.length) continue;

      const insertIndex = allSections.findIndex((s) => s._key === sec._key);
      if (insertIndex === -1) continue;

      console.log(
        `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: content[${sec._key}] → insert ${siblings.length} sibling(s) after index ${insertIndex}`,
      );
      for (const sib of siblings) {
        console.log(`  + ${sib._type}[${sib._key}]`);
      }

      if (!DRY_RUN) {
        await client
          .patch(page._id)
          .insert("after", `sections[_key=="${sec._key}"]`, siblings)
          .commit();

        // Remove sub-fields from the content section
        await client
          .patch(page._id)
          .unset([
            `sections[_key=="${sec._key}"].infoTable`,
            `sections[_key=="${sec._key}"].checklist`,
            `sections[_key=="${sec._key}"].schedule`,
            `sections[_key=="${sec._key}"].documents`,
            `sections[_key=="${sec._key}"].images`,
            `sections[_key=="${sec._key}"].note`,
          ])
          .commit();

        patchCount++;
      }
    }
  }

  console.log(`\nDone. ${DRY_RUN ? "Would patch" : "Patched"} ${patchCount} content section(s).`);
}

main().catch(console.error);
