/**
 * Audit Sanity documents for fields not defined in schemas.
 *
 * Usage:
 *   cd /path/to/project
 *   export $(grep -v '^#' .env.local | grep '=' | xargs)
 *   node scripts/audit-unknown-fields.mjs
 */

import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_TOKEN;

if (!projectId || !dataset || !token) {
  console.error(
    "Missing env vars. Make sure NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, and SANITY_TOKEN are set.",
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2024-01-01",
  useCdn: false,
});

// ── Schema field map ────────────────────────────────────────────────
// Maps document type name → Set of known top-level field names.
// Built-in fields are added to every type automatically.

const BUILTIN_FIELDS = new Set([
  "_id",
  "_type",
  "_rev",
  "_createdAt",
  "_updatedAt",
  "_key",
  "_ref",
  "_weak",
  "_strengthenOnPublish",
  "_dataset",
  "_projectId",
]);

// Document types and their schema-defined fields
const schemaFields = {
  announcement: ["date", "pinned", "title", "content", "image", "documents"],
  page: [
    "slug",
    "template",
    "categoryRef",
    "title",
    "subtitle",
    "description",
    "images",
    "sections",
  ],
  homepage: [
    "slug",
    "template",
    "hero",
    "activityGrid",
    "announcementRefs",
    "eventFlyers",
  ],
  siteSettings: [
    "org",
    "contact",
    "businessHours",
    "copyright",
    "googleMapsEmbedUrl",
  ],
  navigation: ["categories"],
  sidebar: ["memberRecruitment", "documents"],
  category: ["label", "description", "heroImage"],
};

// The internationalized-array plugin creates its own document types
// for translating array metadata. Their fields are: _id, _type, _rev,
// _createdAt, _updatedAt — nothing extra beyond built-ins. But the
// plugin can also store docs of type "translation.metadata" etc.
// We'll treat any _type starting with "internationalizedArray" or
// "translation." as plugin-managed and skip or handle separately.

// ── Fetch & audit ───────────────────────────────────────────────────

const query = `*[!(_type match "system.*") && !(_id in path("_.**"))]`;

console.log("Fetching all documents...");
const docs = await client.fetch(query);
console.log(`Fetched ${docs.length} documents.\n`);

// Collect unknowns: { type, _id, field, value }
const unknowns = [];
const unknownTypesSeen = new Set();

for (const doc of docs) {
  const type = doc._type;

  // Skip plugin-generated document types
  if (
    type.startsWith("internationalizedArray") ||
    type.startsWith("translation.") ||
    type.startsWith("sanity.")
  ) {
    continue;
  }

  const knownFields = schemaFields[type];

  if (!knownFields) {
    // Completely unknown document type
    if (!unknownTypesSeen.has(type)) {
      unknownTypesSeen.add(type);
      console.warn(`⚠  Unknown document type: "${type}" (not in schemas)`);
      console.warn(`   Example _id: ${doc._id}\n`);
    }
    continue;
  }

  const knownSet = new Set([...BUILTIN_FIELDS, ...knownFields]);

  for (const field of Object.keys(doc)) {
    if (!knownSet.has(field)) {
      unknowns.push({
        type,
        _id: doc._id,
        field,
        value: doc[field],
      });
    }
  }
}

// ── Report ──────────────────────────────────────────────────────────

if (unknowns.length === 0 && unknownTypesSeen.size === 0) {
  console.log("All documents match their schemas. No unknown fields found.");
} else {
  if (unknowns.length > 0) {
    console.log(
      `\nFound ${unknowns.length} unknown field(s) across documents:\n`,
    );
    console.log("─".repeat(80));

    // Group by type + field for cleaner output
    const grouped = {};
    for (const u of unknowns) {
      const key = `${u.type}::${u.field}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(u);
    }

    for (const [key, items] of Object.entries(grouped)) {
      const [type, field] = key.split("::");
      console.log(`\nType: "${type}"  Field: "${field}"  (${items.length} doc(s))`);
      for (const item of items) {
        const preview = JSON.stringify(item.value);
        const truncated =
          preview.length > 120 ? preview.slice(0, 120) + "..." : preview;
        console.log(`  _id: ${item._id}`);
        console.log(`  value: ${truncated}`);
        console.log();
      }
    }
  }

  console.log("─".repeat(80));
  console.log(
    `\nSummary: ${unknowns.length} unknown field occurrence(s), ${unknownTypesSeen.size} unknown document type(s).`,
  );
}
