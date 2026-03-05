#!/usr/bin/env node

/**
 * Migration script: Convert internationalizedArrayText fields to Portable Text blocks.
 *
 * Converts existing plain-text i18n values to single-paragraph PT blocks.
 * Each \n in the source text becomes a new block.
 *
 * Usage:
 *   node scripts/migrate-text-to-portable-text.mjs
 *   node scripts/migrate-text-to-portable-text.mjs --dry-run
 *
 * Reads SANITY_TOKEN from .env.local automatically.
 */

import "./load-env.mjs";
import { createClient } from "@sanity/client";
import crypto from "crypto";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_TOKEN,
});

const dryRun = process.argv.includes("--dry-run");

/** Convert a plain-text string to an array of PT blocks (one block per line). */
function textToBlocks(text) {
  if (!text || typeof text !== "string") return [];
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  return lines.map(() => ({
    _type: "block",
    _key: crypto.randomUUID().slice(0, 12),
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: crypto.randomUUID().slice(0, 12),
        text: "",
        marks: [],
      },
    ],
  })).map((block, i) => ({
    ...block,
    children: [
      {
        ...block.children[0],
        text: lines[i],
      },
    ],
  }));
}

/** Convert an i18n array field from text to PT blocks. */
function convertI18nField(fieldValue) {
  if (!Array.isArray(fieldValue)) return null;
  // Check if already converted (value is an array of objects, not a string)
  if (fieldValue.some((entry) => Array.isArray(entry.value))) {
    return null; // Already PT blocks
  }
  return fieldValue.map((entry) => ({
    ...entry,
    value: textToBlocks(entry.value),
  }));
}

// --- Document-level fields ---
const DOCUMENT_FIELDS = {
  announcement: ["content"],
  page: ["description"],
};

// --- Section-level fields (inside page.sections[]) ---
const SECTION_FIELDS = {
  content: ["description", "note"],
  history: ["intro"],
  fairTrade: ["description", "delivery"],
  warnings: null, // special handling: items is array of i18n fields
};

async function migrateDocumentFields() {
  for (const [docType, fields] of Object.entries(DOCUMENT_FIELDS)) {
    const docs = await client.fetch(`*[_type == "${docType}"]`);
    console.log(`\nProcessing ${docs.length} ${docType} documents...`);

    for (const doc of docs) {
      const patches = {};
      for (const field of fields) {
        if (doc[field]) {
          const converted = convertI18nField(doc[field]);
          if (converted) {
            patches[field] = converted;
          }
        }
      }
      if (Object.keys(patches).length > 0) {
        const title = doc.title?.[0]?.value || doc._id;
        console.log(`  ${dryRun ? "[DRY RUN] " : ""}Patching ${docType} "${title}": ${Object.keys(patches).join(", ")}`);
        if (!dryRun) {
          await client.patch(doc._id).set(patches).commit();
        }
      }
    }
  }
}

async function migrateSectionFields() {
  const pages = await client.fetch('*[_type == "page"]');
  console.log(`\nProcessing sections in ${pages.length} pages...`);

  for (const page of pages) {
    if (!page.sections?.length) continue;

    let modified = false;
    const newSections = page.sections.map((section) => {
      // Handle warnings specially: items is an array of i18n fields
      if (section._type === "warnings" && Array.isArray(section.items)) {
        const newItems = section.items.map((item) => {
          const converted = convertI18nField(item);
          if (converted) {
            modified = true;
            return converted;
          }
          return item;
        });
        return { ...section, items: newItems };
      }

      const fieldNames = SECTION_FIELDS[section._type];
      if (!fieldNames) return section;

      const newSection = { ...section };
      for (const field of fieldNames) {
        if (newSection[field]) {
          const converted = convertI18nField(newSection[field]);
          if (converted) {
            newSection[field] = converted;
            modified = true;
          }
        }
      }
      return newSection;
    });

    if (modified) {
      const title = page.title?.[0]?.value || page._id;
      console.log(`  ${dryRun ? "[DRY RUN] " : ""}Patching page "${title}" sections`);
      if (!dryRun) {
        await client.patch(page._id).set({ sections: newSections }).commit();
      }
    }
  }
}

async function main() {
  if (!process.env.SANITY_TOKEN) {
    console.error("Error: SANITY_TOKEN env var is required (must be a write token)");
    process.exit(1);
  }
  if (dryRun) {
    console.log("=== DRY RUN MODE (no changes will be made) ===\n");
  }

  await migrateDocumentFields();
  await migrateSectionFields();

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
