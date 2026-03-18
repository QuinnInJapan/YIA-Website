#!/usr/bin/env node
/**
 * Sanity Data Cleanup Script
 *
 * 1. Deletes legacy `globalResources` document
 * 2. Fills in missing English translations for sidebar documents and pages
 *
 * Usage: export $(grep -v "^#" .env.local | xargs) && node scripts/cleanup-sanity-data.mjs
 */

import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_TOKEN;

if (!projectId || !dataset || !token) {
  console.error("Missing env vars. Run with:");
  console.error(
    '  export $(grep -v "^#" .env.local | xargs) && node scripts/cleanup-sanity-data.mjs',
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

// ─── 1. Delete globalResources ────────────────────────────

async function deleteGlobalResources() {
  const doc = await client.fetch('*[_type == "globalResources"][0]{ _id }');
  if (!doc) {
    console.log("globalResources: already deleted");
    return;
  }
  await client.delete(doc._id);
  console.log(`globalResources: deleted (${doc._id})`);
}

// ─── 2. Fix sidebar missing English translations ──────────

async function fixSidebarTranslations() {
  const sidebar = await client.fetch('*[_type == "sidebar"][0]');
  if (!sidebar) {
    console.log("sidebar: not found");
    return;
  }

  const docs = sidebar.documents ?? [];
  let changed = false;

  // Map of known Japanese document labels to English translations
  const translations = {
    定款: "Articles of Incorporation",
    事業計画: "Business Plan",
    事業報告: "Business Report",
    予算書: "Budget",
    決算書: "Financial Statement",
    役員名簿: "Board Members List",
    会員申込書: "Membership Application Form",
  };

  const updatedDocs = docs.map((doc) => {
    const label = doc.label;
    if (!label || !Array.isArray(label)) return doc;

    const hasEn = label.some((l) => l._key === "en");
    if (hasEn) return doc;

    const jaValue = label.find((l) => l._key === "ja")?.value ?? "";
    // Try to find a translation, fall back to Japanese value
    let enValue = "";
    for (const [ja, en] of Object.entries(translations)) {
      if (jaValue.includes(ja)) {
        enValue = en;
        break;
      }
    }

    if (!enValue) {
      console.log(`  sidebar doc "${jaValue}": no translation found, using Japanese`);
      enValue = jaValue;
    }

    changed = true;
    return {
      ...doc,
      label: [...label, { _key: "en", value: enValue }],
    };
  });

  if (changed) {
    await client.patch(sidebar._id).set({ documents: updatedDocs }).commit();
    console.log(`sidebar: added English translations to ${docs.length} document labels`);
  } else {
    console.log("sidebar: all document labels already have English");
  }
}

// ─── 3. Fix page missing English translations ─────────────

async function fixPageTranslations() {
  // page-kaiinn: missing en in description
  const kaiinn = await client.fetch('*[_type == "page" && _id == "page-kaiinn"][0]');
  if (kaiinn) {
    const desc = kaiinn.description;
    if (desc && Array.isArray(desc) && !desc.some((d) => d._key === "en")) {
      const jaVal = desc.find((d) => d._key === "ja")?.value ?? "";
      await client
        .patch("page-kaiinn")
        .set({
          description: [...desc, { _key: "en", value: "Membership Information" }],
        })
        .commit();
      console.log(`page-kaiinn: added English description (ja was: "${jaVal}")`);
    } else {
      console.log("page-kaiinn: description already has English");
    }
  }

  // page-sanjyokaiin: missing en in subtitle
  const sanjyo = await client.fetch('*[_type == "page" && _id == "page-sanjyokaiin"][0]');
  if (sanjyo) {
    const sub = sanjyo.subtitle;
    if (sub && Array.isArray(sub) && !sub.some((s) => s._key === "en")) {
      const jaVal = sub.find((s) => s._key === "ja")?.value ?? "";
      await client
        .patch("page-sanjyokaiin")
        .set({
          subtitle: [...sub, { _key: "en", value: "Supporting Members" }],
        })
        .commit();
      console.log(`page-sanjyokaiin: added English subtitle (ja was: "${jaVal}")`);
    } else {
      console.log("page-sanjyokaiin: subtitle already has English");
    }
  }
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  console.log("Cleaning up Sanity data...\n");

  await deleteGlobalResources();
  await fixSidebarTranslations();
  await fixPageTranslations();

  console.log("\nDone! Run the audit script again to verify:");
  console.log("  export $(grep -v '^#' .env.local | xargs) && node scripts/audit-sanity-data.mjs");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
