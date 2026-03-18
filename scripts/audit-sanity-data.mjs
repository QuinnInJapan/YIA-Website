#!/usr/bin/env node
/**
 * Sanity Data Audit Script
 *
 * Pulls all documents from Sanity and checks for:
 * - Legacy fields (e.g. announcement.content, announcement.image)
 * - I18n fields that are plain strings instead of [{_key, value}] arrays
 * - Missing required fields
 * - Broken references
 * - Unexpected _type values
 * - Empty or null fields that should have data
 *
 * Usage: node scripts/audit-sanity-data.mjs
 */

import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_TOKEN;

if (!projectId || !dataset || !token) {
  console.error("Missing env vars. Run with:");
  console.error(
    '  export $(grep -v "^#" .env.local | xargs) && node scripts/audit-sanity-data.mjs',
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

// ─── Helpers ──────────────────────────────────────────────────────────

const issues = [];

function warn(docType, docId, message, detail) {
  issues.push({ docType, docId, message, detail });
}

function isI18nArray(val) {
  return Array.isArray(val) && val.every((item) => item._key && "value" in item);
}

function checkI18nField(doc, fieldPath, value, required = false) {
  if (value === undefined || value === null) {
    if (required) warn(doc._type, doc._id, `Missing required i18n field: ${fieldPath}`);
    return;
  }
  if (typeof value === "string") {
    warn(
      doc._type,
      doc._id,
      `Legacy plain string in i18n field: ${fieldPath}`,
      `value: "${value.slice(0, 80)}"`,
    );
    return;
  }
  if (!isI18nArray(value)) {
    warn(
      doc._type,
      doc._id,
      `Malformed i18n field: ${fieldPath}`,
      `type: ${typeof value}, isArray: ${Array.isArray(value)}`,
    );
    return;
  }
  const keys = value.map((v) => v._key);
  if (!keys.includes("ja"))
    warn(doc._type, doc._id, `Missing 'ja' key in i18n field: ${fieldPath}`);
  if (!keys.includes("en"))
    warn(doc._type, doc._id, `Missing 'en' key in i18n field: ${fieldPath}`);
  // Check for empty values
  for (const entry of value) {
    if (entry.value === "" || entry.value === null || entry.value === undefined) {
      warn(doc._type, doc._id, `Empty ${entry._key} value in i18n field: ${fieldPath}`);
    }
  }
}

function checkRef(doc, fieldPath, value) {
  if (!value) return;
  if (value._ref) {
    allRefs.push({ docType: doc._type, docId: doc._id, fieldPath, ref: value._ref });
  }
}

const allRefs = [];

// ─── Type-specific auditors ──────────────────────────────────────────

function auditAnnouncement(doc) {
  // Legacy fields
  if (doc.content)
    warn(
      doc._type,
      doc._id,
      "Has legacy 'content' field (should use 'body')",
      `type: ${typeof doc.content}, isArray: ${Array.isArray(doc.content)}`,
    );
  if (doc.image) warn(doc._type, doc._id, "Has legacy 'image' field (should use 'heroImage')");

  // Required fields
  checkI18nField(doc, "title", doc.title, true);
  checkI18nField(doc, "body", doc.body, true);
  if (!doc.slug) warn(doc._type, doc._id, "Missing slug");
  if (!doc.date) warn(doc._type, doc._id, "Missing date");

  // Optional i18n
  checkI18nField(doc, "excerpt", doc.excerpt);
  if (doc.heroImage?.alt) checkI18nField(doc, "heroImage.alt", doc.heroImage.alt);
}

function auditPage(doc) {
  if (!doc.slug) warn(doc._type, doc._id, "Missing slug");
  checkI18nField(doc, "title", doc.title, true);
  checkI18nField(doc, "subtitle", doc.subtitle);
  checkI18nField(doc, "description", doc.description);

  if (doc.categoryRef) checkRef(doc, "categoryRef", doc.categoryRef);

  // Audit sections
  if (doc.sections && Array.isArray(doc.sections)) {
    const knownSectionTypes = [
      "content",
      "infoTable",
      "links",
      "warnings",
      "gallery",
      "flyers",
      "eventSchedule",
      "groupSchedule",
      "tableSchedule",
      "definitions",
      "feeTable",
      "directoryList",
      "boardMembers",
      "fairTrade",
      "sisterCities",
      "history",
    ];
    for (const [i, section] of doc.sections.entries()) {
      if (!section._type) {
        warn(doc._type, doc._id, `Section [${i}] missing _type`);
      } else if (!knownSectionTypes.includes(section._type)) {
        warn(doc._type, doc._id, `Section [${i}] unknown _type: "${section._type}"`);
      }
      // Check i18n fields in sections
      if (section.title) checkI18nField(doc, `sections[${i}].title`, section.title);
      if (section.description)
        checkI18nField(doc, `sections[${i}].description`, section.description);
    }
  } else if (!doc.sections) {
    warn(doc._type, doc._id, "Missing sections array");
  }
}

function auditBlogPost(doc) {
  checkI18nField(doc, "title", doc.title, true);
  checkI18nField(doc, "body", doc.body, true);
  checkI18nField(doc, "excerpt", doc.excerpt);
  checkI18nField(doc, "category", doc.category);
  if (!doc.slug?.current && !doc.slug) warn(doc._type, doc._id, "Missing slug");
  if (!doc.publishedAt) warn(doc._type, doc._id, "Missing publishedAt");
  if (doc.heroImage?.alt) checkI18nField(doc, "heroImage.alt", doc.heroImage.alt);
  if (doc.relatedPosts) {
    for (const ref of doc.relatedPosts) checkRef(doc, "relatedPosts", ref);
  }
}

function auditCategory(doc) {
  checkI18nField(doc, "label", doc.label, true);
  checkI18nField(doc, "description", doc.description);
}

function auditNavigation(doc) {
  if (!doc.categories || !Array.isArray(doc.categories)) {
    warn(doc._type, doc._id, "Missing categories array");
    return;
  }
  for (const [i, cat] of doc.categories.entries()) {
    if (cat.categoryRef) checkRef(doc, `categories[${i}].categoryRef`, cat.categoryRef);
    if (cat.items && Array.isArray(cat.items)) {
      for (const [j, item] of cat.items.entries()) {
        if (item.pageRef) checkRef(doc, `categories[${i}].items[${j}].pageRef`, item.pageRef);
      }
    }
  }
}

function auditSiteSettings(doc) {
  if (!doc.org) warn(doc._type, doc._id, "Missing org object");
  else {
    checkI18nField(doc, "org.name", doc.org.name, true);
    checkI18nField(doc, "org.description", doc.org.description);
  }
  if (!doc.contact) warn(doc._type, doc._id, "Missing contact object");
  else {
    if (doc.contact.address) checkI18nField(doc, "contact.address", doc.contact.address);
  }
  checkI18nField(doc, "businessHours", doc.businessHours);
}

function auditHomepage(doc) {
  if (doc.hero?.tagline) checkI18nField(doc, "hero.tagline", doc.hero.tagline);
  if (doc.activityGrid?.stat?.label)
    checkI18nField(doc, "activityGrid.stat.label", doc.activityGrid.stat.label);
  if (doc.announcementRefs) {
    for (const ref of doc.announcementRefs) checkRef(doc, "announcementRefs", ref);
  }
}

function auditSidebar(doc) {
  if (doc.documents) {
    for (const [i, d] of doc.documents.entries()) {
      checkI18nField(doc, `documents[${i}].label`, d.label);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("Fetching all documents from Sanity...\n");

  const allDocs = await client.fetch(`*[!(_type match "system.*") && !(_id in path("_.**"))]`);

  console.log(`Total documents: ${allDocs.length}\n`);

  // Count by type
  const typeCounts = {};
  for (const doc of allDocs) {
    typeCounts[doc._type] = (typeCounts[doc._type] || 0) + 1;
  }
  console.log("Document counts by type:");
  for (const [type, count] of Object.entries(typeCounts).sort()) {
    console.log(`  ${type}: ${count}`);
  }
  console.log();

  // Known types
  const knownTypes = [
    "announcement",
    "blogPost",
    "category",
    "homepage",
    "homepageAbout",
    "navigation",
    "page",
    "sidebar",
    "siteSettings",
    "sanity.imageAsset",
    "sanity.fileAsset",
  ];
  const unknownTypes = Object.keys(typeCounts).filter((t) => !knownTypes.includes(t));
  if (unknownTypes.length) {
    console.log("⚠ Unknown document types:", unknownTypes.join(", "));
    console.log();
  }

  // Collect all document IDs for reference checking
  const allDocIds = new Set(allDocs.map((d) => d._id));

  // Run type-specific audits
  for (const doc of allDocs) {
    // Skip drafts for now (they duplicate published docs)
    if (doc._id.startsWith("drafts.")) continue;

    switch (doc._type) {
      case "announcement":
        auditAnnouncement(doc);
        break;
      case "page":
        auditPage(doc);
        break;
      case "blogPost":
        auditBlogPost(doc);
        break;
      case "category":
        auditCategory(doc);
        break;
      case "navigation":
        auditNavigation(doc);
        break;
      case "siteSettings":
        auditSiteSettings(doc);
        break;
      case "homepage":
        auditHomepage(doc);
        break;
      case "sidebar":
        auditSidebar(doc);
        break;
      case "sanity.imageAsset":
      case "sanity.fileAsset":
      case "homepageAbout":
        break; // skip asset docs
      default:
        warn(doc._type, doc._id, `Unaudited document type: ${doc._type}`);
    }
  }

  // Check broken references
  for (const { docType, docId, fieldPath, ref } of allRefs) {
    if (!allDocIds.has(ref) && !allDocIds.has(`drafts.${ref}`)) {
      warn(docType, docId, `Broken reference in ${fieldPath}`, `_ref: ${ref}`);
    }
  }

  // ─── Report ──────────────────────────────────────────────────────────

  if (issues.length === 0) {
    console.log("✅ No issues found!");
    return;
  }

  // Group by severity categories
  const legacy = issues.filter((i) => i.message.includes("legacy") || i.message.includes("Legacy"));
  const missing = issues.filter((i) => i.message.includes("Missing"));
  const malformed = issues.filter(
    (i) => i.message.includes("Malformed") || i.message.includes("unknown"),
  );
  const empty = issues.filter((i) => i.message.includes("Empty"));
  const broken = issues.filter((i) => i.message.includes("Broken"));
  const other = issues.filter(
    (i) =>
      !legacy.includes(i) &&
      !missing.includes(i) &&
      !malformed.includes(i) &&
      !empty.includes(i) &&
      !broken.includes(i),
  );

  function printGroup(label, items) {
    if (!items.length) return;
    console.log(`\n${"═".repeat(60)}`);
    console.log(`${label} (${items.length})`);
    console.log("═".repeat(60));
    for (const i of items) {
      console.log(`  [${i.docType}] ${i.docId}`);
      console.log(`    → ${i.message}`);
      if (i.detail) console.log(`      ${i.detail}`);
    }
  }

  printGroup("🔴 BROKEN REFERENCES", broken);
  printGroup("🟠 LEGACY FIELDS", legacy);
  printGroup("🟡 MALFORMED DATA", malformed);
  printGroup("🟡 MISSING REQUIRED FIELDS", missing);
  printGroup("🔵 EMPTY I18N VALUES", empty);
  printGroup("⚪ OTHER", other);

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Total issues: ${issues.length}`);
  console.log(
    `  Broken refs: ${broken.length}, Legacy: ${legacy.length}, Malformed: ${malformed.length}`,
  );
  console.log(`  Missing: ${missing.length}, Empty: ${empty.length}, Other: ${other.length}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
