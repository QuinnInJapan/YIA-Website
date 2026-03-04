#!/usr/bin/env node

/**
 * Migration script: site-data.json → Sanity
 *
 * Usage:
 *   SANITY_TOKEN=<token> node scripts/migrate-to-sanity.mjs
 *   SANITY_TOKEN=<token> node scripts/migrate-to-sanity.mjs --dry-run
 */

import { createClient } from '@sanity/client';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = createClient({
  projectId: 'tarzpcp3',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
});

const dryRun = process.argv.includes('--dry-run');
const data = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'data', 'site-data.json'), 'utf-8')
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let keyCounter = 0;
function generateKey() {
  return `key${keyCounter++}`;
}

/**
 * Recursively add `_key` to every object that lives inside an array.
 */
function addKeys(value) {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const keyed = { ...item, _key: item.id || item._key || generateKey() };
        for (const [k, v] of Object.entries(keyed)) {
          keyed[k] = addKeys(v);
        }
        return keyed;
      }
      return item;
    });
  }

  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = addKeys(v);
    }
    return out;
  }

  return value;
}

/**
 * Process schedule sections:
 *  - rename `type` → `scheduleType`
 *  - convert rows that are string[][] → JSON string
 */
function processScheduleSections(obj) {
  if (Array.isArray(obj)) {
    return obj.map(processScheduleSections);
  }
  if (obj !== null && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = processScheduleSections(v);
    }
    if (out._type === 'schedule') {
      if ('type' in out) {
        out.scheduleType = out.type;
        delete out.type;
      }
      if (
        Array.isArray(out.rows) &&
        out.rows.length > 0 &&
        Array.isArray(out.rows[0])
      ) {
        out.rows = JSON.stringify(out.rows);
      }
    }
    return out;
  }
  return obj;
}

/**
 * Prepare a Sanity document: add _id, _type, strip conflicting fields,
 * apply _key to array items, and process schedule sections.
 */
function prepareDoc({ _id, _type, raw }) {
  let doc = { _id, _type, ...raw };

  // Process schedule sections (rename type, stringify rows)
  doc = processScheduleSections(doc);

  // Add _key to all objects inside arrays
  doc = addKeys(doc);

  // Ensure top-level _id and _type aren't overwritten by addKeys
  doc._id = _id;
  doc._type = _type;

  return doc;
}

// ---------------------------------------------------------------------------
// Build document list
// ---------------------------------------------------------------------------

const documents = [];

// --- Singletons ---

const singletons = [
  { key: 'site', _id: 'siteSettings', _type: 'siteSettings' },
  { key: 'navigation', _id: 'navigation', _type: 'navigation' },
  { key: 'globalResources', _id: 'globalResources', _type: 'globalResources' },
  { key: 'homepage', _id: 'homepage', _type: 'homepage' },
];

for (const { key, _id, _type } of singletons) {
  const raw = data[key];
  if (!raw) {
    console.warn(`⚠  Key "${key}" not found in site-data.json, skipping.`);
    continue;
  }
  documents.push(
    prepareDoc({
      _id,
      _type: raw._type || _type,
      raw,
    })
  );
}

// --- Arrays ---

// Categories
if (data.categories) {
  for (const cat of data.categories) {
    documents.push(
      prepareDoc({
        _id: `category-${cat.id}`,
        _type: cat._type || 'category',
        raw: cat,
      })
    );
  }
}

// Announcements
if (data.announcements) {
  for (const ann of data.announcements) {
    documents.push(
      prepareDoc({
        _id: `announcement-${ann.id}`,
        _type: ann._type || 'announcement',
        raw: ann,
      })
    );
  }
}

// Pages (unified — includes program pages and org pages)
if (data.pages) {
  for (const page of data.pages) {
    documents.push(
      prepareDoc({
        _id: `page-${page.id}`,
        _type: page._type || 'page',
        raw: page,
      })
    );
  }
}

// ---------------------------------------------------------------------------
// Delete old document types that no longer exist in the schema
// ---------------------------------------------------------------------------

const OLD_TYPES = ['programPage', 'aboutPage', 'membershipPage', 'directoryPage'];

async function deleteOldDocuments() {
  for (const oldType of OLD_TYPES) {
    const oldDocs = await client.fetch(`*[_type == "${oldType}"]{ _id }`);
    if (oldDocs.length === 0) continue;

    console.log(`\n🗑  Deleting ${oldDocs.length} old "${oldType}" document(s)...`);
    for (const doc of oldDocs) {
      const label = `${oldType} (${doc._id})`;
      try {
        if (dryRun) {
          console.log(`  [dry-run] Would delete: ${label}`);
        } else {
          await client.delete(doc._id);
          console.log(`  ✓ deleted ${label}`);
        }
      } catch (err) {
        console.error(`  ✗ ${label}: ${err.message}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Push to Sanity
// ---------------------------------------------------------------------------

async function migrate() {
  // First, delete old documents
  await deleteOldDocuments();

  console.log(`\nFound ${documents.length} documents to migrate.`);
  if (dryRun) {
    console.log('🏃 DRY RUN — no documents will be written.\n');
  }

  let success = 0;
  let failed = 0;

  for (const doc of documents) {
    const label = `${doc._type} (${doc._id})`;
    try {
      if (dryRun) {
        console.log(`  [dry-run] Would createOrReplace: ${label}`);
      } else {
        await client.createOrReplace(doc);
        console.log(`  ✓ ${label}`);
      }
      success++;
    } catch (err) {
      console.error(`  ✗ ${label}: ${err.message}`);
      failed++;
    }
  }

  console.log(
    `\nDone. ${success} succeeded, ${failed} failed.${dryRun ? ' (dry run)' : ''}\n`
  );
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
