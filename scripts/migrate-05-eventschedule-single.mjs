/**
 * Migration 05: eventSchedule single-date → labelTable
 *
 * eventSchedule sections with .entry (single date) → labelTable with
 * date/time/venue as label-value pairs.
 *
 * Affects: page-kids, page-nihonbunka (2 instances with .entry)
 *
 * Run:
 *   export SANITY_TOKEN=<token> && node scripts/migrate-05-eventschedule-single.mjs
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

function bi(ja, en) {
  return [
    { _key: "ja", value: ja ?? "" },
    { _key: "en", value: en ?? "" },
  ];
}

function getVal(i18n, lang) {
  return i18n?.find((v) => v._key === lang)?.value ?? "";
}

async function main() {
  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      "sections": sections[_type == "eventSchedule" && defined(entry)]{
        _key,
        title,
        hideTitle,
        entry,
        venue
      }
    }[count(sections) > 0]`,
  );

  let patchCount = 0;

  for (const page of pages) {
    for (const sec of page.sections) {
      const rows = [];

      if (sec.entry?.date) {
        const dateStr = sec.entry.time ? `${sec.entry.date} ${sec.entry.time}` : sec.entry.date;
        rows.push({
          _key: randomKey(),
          label: bi("日時", "Date / Time"),
          value: bi(dateStr, dateStr),
        });
      }

      if (sec.venue?.location) {
        rows.push({
          _key: randomKey(),
          label: bi("会場", "Venue"),
          value: bi(getVal(sec.venue.location, "ja"), getVal(sec.venue.location, "en")),
        });
      }

      const newSection = {
        _type: "labelTable",
        title: sec.title,
        hideTitle: sec.hideTitle,
        rows,
      };

      console.log(
        `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: eventSchedule[${sec._key}] (single) → labelTable (${rows.length} rows)`,
      );

      if (!DRY_RUN) {
        await client
          .patch(page._id)
          .set({ [`sections[_key=="${sec._key}"]`]: { _key: sec._key, ...newSection } })
          .commit();
        patchCount++;
      }
    }
  }

  console.log(`\nDone. ${DRY_RUN ? "Would patch" : "Patched"} ${patchCount} section(s).`);
}

main().catch(console.error);
