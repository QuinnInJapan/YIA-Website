#!/usr/bin/env node

import { fail, logSummary, patchWithRevision, runSanityScript } from "./lib/sanity-tools.mjs";

const PAGE_IDS = ["page-nihonbunka", "drafts.page-nihonbunka"];
const SCHEDULE_KEY = "key121";
const TARGET_DATE = /(?:2026[-/]0?6[-/]13|6\s*\/\s*13|６\s*\/\s*１３|6月13日|６月１３日)/;

await runSanityScript({
  name: "E-011A Japanese culture ended date",
  description:
    "Adds an ended marker next to the 6/13 schedule date on the Japanese Culture & JFY page.",
  async handler({ client, dryRun }) {
    const docs = await client.fetch(`*[_id in $ids]{_id,_rev,sections}`, { ids: PAGE_IDS });

    let patched = 0;
    let skippedUnchanged = 0;
    const results = [];

    for (const doc of docs ?? []) {
      const sections = structuredClone(doc.sections ?? []);
      const schedule = findSchedule(sections, doc._id);
      const update = addEndedMarker(schedule, doc._id);

      if (!update.changed) {
        skippedUnchanged += 1;
        results.push({ docId: doc._id, ...update });
        continue;
      }

      await patchWithRevision(client, doc, { sections }, { dryRun });
      patched += 1;
      results.push({ docId: doc._id, ...update });
    }

    logSummary({
      dryRun,
      found: docs?.length ?? 0,
      patched,
      skippedUnchanged,
      results,
    });
  },
});

function findSchedule(sections, docId) {
  const byKey = sections.find((section) => section._key === SCHEDULE_KEY);
  if (byKey?._type === "table") return byKey;

  const byDate = sections.find(
    (section) =>
      section._type === "table" &&
      (section.rows ?? []).some((row) =>
        (row.cells ?? []).some((cell) => TARGET_DATE.test(cellText(cell))),
      ),
  );
  if (byDate) return byDate;

  throw fail("Could not find the Japanese Culture & JFY schedule table.", {
    fix: "Check the current Sanity page sections and update the script target key or date matcher.",
    context: { docId, expectedKey: SCHEDULE_KEY },
  });
}

function addEndedMarker(table, docId) {
  for (const [rowIndex, row] of (table.rows ?? []).entries()) {
    for (const [cellIndex, cell] of (row.cells ?? []).entries()) {
      if (!TARGET_DATE.test(cellText(cell))) continue;

      const before = structuredClone(cell);
      const after = markCellEnded(cell);
      row.cells[cellIndex] = after;

      return {
        changed: JSON.stringify(before) !== JSON.stringify(after),
        sectionKey: table._key,
        rowKey: row._key,
        rowIndex,
        cellIndex,
        before,
        after,
      };
    }
  }

  throw fail("Could not find the 6/13 schedule row.", {
    fix: "Confirm the schedule still includes a 6/13 row before rerunning.",
    context: { docId, sectionKey: table._key },
  });
}

function markCellEnded(cell) {
  const next = Array.isArray(cell) ? structuredClone(cell) : [];
  return ["ja", "en"].reduce((field, lang) => setEndedValue(field, lang), next);
}

function setEndedValue(field, lang) {
  const index = field.findIndex((entry) => entry._key === lang);
  if (index === -1) return field;

  const current = field[index]?.value ?? "";
  if (typeof current !== "string" || !current.trim()) return field;
  if (lang === "ja" && current.includes("終了")) return field;
  if (lang === "en" && /\bended\b/i.test(current)) return field;

  field[index] = {
    ...field[index],
    value: `${current}${lang === "ja" ? "（終了）" : " (Ended)"}`,
  };
  return field;
}

function cellText(cell) {
  return (cell ?? [])
    .map((entry) => (typeof entry?.value === "string" ? entry.value : ""))
    .join(" ");
}
