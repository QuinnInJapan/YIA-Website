#!/usr/bin/env node

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fail, patchWithRevision, runSanityScript } from "./lib/sanity-tools.mjs";

await runSanityScript({
  name: "Correct mixed-format attachment headings",
  description: "Change 資料 / PDF to 資料 / Materials in class schedules and existing drafts.",
  async handler({ client, dryRun, env }) {
    const pages = await client.fetch('*[_id in ["page-kaiwasalon", "drafts.page-kaiwasalon"]]');
    if (!pages.some((page) => page._id === "page-kaiwasalon")) {
      throw fail("Published conversation-class page not found.", { fix: "Check the selected dataset." });
    }
    const changes = pages.map((page) => {
      const set = {};
      for (const section of page.sections ?? []) {
        for (const column of section.columns ?? []) {
          const ja = column.label?.find((label) => label._key === "ja")?.value;
          const en = column.label?.find((label) => label._key === "en")?.value;
          if (column.type !== "file" || ja !== "資料" || en !== "PDF") continue;
          const field = `sections[_key==${JSON.stringify(section._key)}].columns[_key==${JSON.stringify(column._key)}].label[_key=="en"].value`;
          set[field] = "Materials";
          console.log(`${page._id} / ${section._key}: 資料 / PDF → 資料 / Materials`);
        }
      }
      return { page, set };
    }).filter(({ set }) => Object.keys(set).length);

    if (!dryRun && changes.length) {
      const directory = mkdtempSync(path.join(tmpdir(), "yia-attachment-copy-"));
      const backup = path.join(directory, `${env.dataset}-before.json`);
      writeFileSync(backup, JSON.stringify(changes.map(({ page }) => page), null, 2), { mode: 0o600 });
      console.log(`Recovery snapshot: ${backup}`);
    }
    for (const { page, set } of changes) {
      await patchWithRevision(client, page, set, { dryRun });
    }
    console.log(`${dryRun ? "Would update" : "Updated"} ${changes.length} documents.`);
    if (!dryRun && changes.length) {
      console.log("Verify publish webhook delivery and affected page output before reporting live.");
    }
  },
});
