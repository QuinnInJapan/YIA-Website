/**
 * Migration 03: Inline labelTable (formerly infoTable) note fields
 *
 * - appointmentNote: appended to the value of the row labelled "予約"
 * - additionalLanguageNote: appended to the value of the row labelled "対応言語"
 * - otherNotes: converted to a standalone `warnings` section inserted after
 *
 * Affects: page-seikatsusodan (appointmentNote + additionalLanguageNote)
 *          page-cooking (otherNotes)
 *
 * Run:
 *   export SANITY_TOKEN=<token> && node scripts/migrate-03-labeltable-notes.mjs
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

function getVal(i18nArr, lang) {
  return i18nArr?.find((v) => v._key === lang)?.value ?? "";
}

function setVal(i18nArr, lang, newValue) {
  return (i18nArr ?? []).map((v) => (v._key === lang ? { ...v, value: newValue } : v));
}

async function main() {
  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      "ltSections": sections[_type in ["labelTable", "infoTable"]]{
        _key,
        rows,
        appointmentNote,
        additionalLanguageNote,
        otherNotes
      }
    }[count(ltSections[defined(appointmentNote) || defined(additionalLanguageNote) || defined(otherNotes)]) > 0]`,
  );

  let patchCount = 0;

  for (const page of pages) {
    const affectedSections = page.ltSections.filter(
      (s) => s.appointmentNote || s.additionalLanguageNote || s.otherNotes,
    );

    for (const sec of affectedSections) {
      console.log(`${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: labelTable[${sec._key}]`);

      let updatedRows = (sec.rows ?? []).map((row) => {
        const jaLabel = getVal(row.label, "ja");

        if (sec.appointmentNote && jaLabel === "予約") {
          const jaAppended = `${getVal(row.value, "ja")}\n${getVal(sec.appointmentNote, "ja")}`;
          const enAppended = `${getVal(row.value, "en")}\n${getVal(sec.appointmentNote, "en")}`;
          console.log(`  inline appointmentNote into "予約" row`);
          return {
            ...row,
            value: setVal(setVal(row.value, "ja", jaAppended), "en", enAppended),
          };
        }

        if (sec.additionalLanguageNote && jaLabel === "対応言語") {
          const jaAppended = `${getVal(row.value, "ja")}\n${getVal(sec.additionalLanguageNote, "ja")}`;
          const enAppended = `${getVal(row.value, "en")}\n${getVal(sec.additionalLanguageNote, "en")}`;
          console.log(`  inline additionalLanguageNote into "対応言語" row`);
          return {
            ...row,
            value: setVal(setVal(row.value, "ja", jaAppended), "en", enAppended),
          };
        }

        return row;
      });

      if (!DRY_RUN) {
        const unsetFields = [
          `sections[_key=="${sec._key}"].appointmentNote`,
          `sections[_key=="${sec._key}"].additionalLanguageNote`,
        ].filter((_, i) => (i === 0 ? !!sec.appointmentNote : !!sec.additionalLanguageNote));

        await client
          .patch(page._id)
          .set({ [`sections[_key=="${sec._key}"].rows`]: updatedRows })
          .unset(unsetFields)
          .commit();
      }

      if (sec.otherNotes) {
        const warningsSection = {
          _type: "warnings",
          _key: randomKey(),
          items: [{ _key: randomKey(), value: sec.otherNotes }],
        };
        console.log(`  otherNotes → warnings[${warningsSection._key}] after section`);

        if (!DRY_RUN) {
          await client
            .patch(page._id)
            .insert("after", `sections[_key=="${sec._key}"]`, [warningsSection])
            .unset([`sections[_key=="${sec._key}"].otherNotes`])
            .commit();
        }
      }

      patchCount++;
    }
  }

  console.log(`\nDone. ${DRY_RUN ? "Would patch" : "Patched"} ${patchCount} section(s).`);
}

main().catch(console.error);
