/**
 * Migration: Convert tableSchedule.rows from JSON text to structured array
 *
 * Before: rows: '[[\"月\",\"10:00\",\"教室A\"],[\"水\",\"14:00\",\"教室B\"]]'
 * After:  rows: [{ _type: "object", _key: "...", cells: ["月","10:00","教室A"] }, ...]
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/migrate-table-rows.mjs
 *
 * Add --dry-run to preview without writing.
 */

import { createClient } from "next-sanity";
import { randomBytes } from "crypto";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

const DRY_RUN = process.argv.includes("--dry-run");

function nanoid() {
  return randomBytes(6).toString("hex");
}

async function main() {
  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      sections[_type == "tableSchedule"]{
        _key,
        rows
      }
    }[count(sections) > 0]`
  );

  let patchCount = 0;

  for (const page of pages) {
    for (const section of page.sections) {
      if (!section.rows) continue;

      // Skip if already migrated (array of objects with cells)
      if (Array.isArray(section.rows) && section.rows[0]?.cells) {
        console.log(`  ✓ ${page._id} section ${section._key} — already structured`);
        continue;
      }

      let parsed;
      if (typeof section.rows === "string") {
        try {
          parsed = JSON.parse(section.rows);
        } catch (e) {
          console.log(`  ⚠️ ${page._id} section ${section._key} — invalid JSON: ${e.message}`);
          continue;
        }
      } else if (Array.isArray(section.rows)) {
        // Already a 2D array — convert to structured
        parsed = section.rows;
      } else {
        continue;
      }

      if (!Array.isArray(parsed)) continue;

      const structured = parsed.map((row) => ({
        _type: "object",
        _key: nanoid(),
        cells: Array.isArray(row) ? row : [String(row)],
      }));

      console.log(`${DRY_RUN ? "[DRY RUN] " : ""}Patching ${page._id}, section ${section._key}: ${structured.length} rows`);
      for (const row of structured.slice(0, 3)) {
        console.log(`  ${row.cells.join(" | ")}`);
      }
      if (structured.length > 3) console.log(`  ... and ${structured.length - 3} more`);

      if (!DRY_RUN) {
        await client
          .patch(page._id)
          .set({
            [`sections[_key=="${section._key}"].rows`]: structured,
          })
          .commit();
        patchCount++;
      }
    }
  }

  console.log(`\nDone. ${DRY_RUN ? "Would patch" : "Patched"} ${patchCount} section(s).`);
}

main().catch(console.error);
