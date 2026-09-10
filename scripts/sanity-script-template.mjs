#!/usr/bin/env node

import {
  fail,
  findRowByJaLabel,
  findSection,
  i18n,
  logSummary,
  patchWithRevision,
  runSanityScript,
} from "./lib/sanity-tools.mjs";

// Announcement mutation scripts must also import validateAnnouncementForMutation
// and call it on the final document shape before patching or publishing. Live
// production writes additionally require --allow-production.
// Public pages use on-demand revalidation only. After live mutations, verify
// webhook delivery or POST to /api/revalidate with the configured secret, then
// request the affected pages before reporting the content live.
// If manually refreshing, send {schemaVersion: 1, before, after} using the
// complete fetched/patched documents (null for create/delete). This preserves
// targeted invalidation and old slugs; {paths: [...]} is a full-cache fallback.

function argValue(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw fail(`Missing value for ${name}.`, {
      fix: `Run with ${name} <value>.`,
      context: { args },
    });
  }
  return value;
}

await runSanityScript({
  name: "Sanity script template",
  description: "Copy this file for future Sanity content patches. It is safe by default.",
  async handler({ client, dryRun, args }) {
    if (!dryRun) {
      throw fail("The Sanity script template cannot run live.", {
        fix: "Copy this file to a task-specific script, replace the placeholder mutation, then run that script with --live. If it intentionally targets production, also pass --allow-production.",
      });
    }

    const pageId = argValue(args, "--page-id", "page-kaiwasalon");
    const sectionKey = argValue(args, "--section-key", "key43");
    const rowLabel = argValue(args, "--row-label", "対象");

    const page = await client.fetch(`*[_type == "page" && _id == $pageId][0]`, { pageId });
    if (!page) {
      throw fail("Target page was not found.", {
        fix: "Check --page-id against the current Sanity dataset.",
        context: { pageId },
      });
    }

    const sections = structuredClone(page.sections ?? []);
    const section = findSection({ ...page, sections }, sectionKey, "labelTable");
    const row = findRowByJaLabel(section.rows, rowLabel, { required: false });

    if (!row) {
      console.log(`Row "${rowLabel}" was not found; template will not patch.`);
      logSummary({ pageId, sectionKey, rowLabel, changed: false });
      return;
    }

    row.value = i18n("ここに日本語の値を入れる", "Put the English value here");

    await patchWithRevision(client, page, { sections }, { dryRun });
    logSummary({ pageId, sectionKey, rowLabel, changed: true, dryRun });
  },
});
