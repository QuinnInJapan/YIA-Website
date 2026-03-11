/**
 * Audit block content fields to check for rich formatting before converting to plain text.
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | grep '=' | xargs)
 *   node scripts/audit-block-fields.mjs
 */

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

// Check if a portable text block array has any rich formatting
function analyzeBlocks(blocks) {
  if (!Array.isArray(blocks)) return null;

  const issues = [];

  for (const block of blocks) {
    if (block._type !== "block") {
      issues.push(`Non-block type: ${block._type}`);
      continue;
    }

    // Check for non-normal styles (headings)
    if (block.style && block.style !== "normal") {
      issues.push(`Style: ${block.style}`);
    }

    // Check for list items
    if (block.listItem) {
      issues.push(`List: ${block.listItem}`);
    }

    // Check for marks (bold, italic, links)
    if (block.children) {
      for (const child of block.children) {
        if (child.marks && child.marks.length > 0) {
          issues.push(`Marks: [${child.marks.join(", ")}] on "${child.text?.slice(0, 40)}"`);
        }
      }
    }

    // Check for markDefs (link annotations)
    if (block.markDefs && block.markDefs.length > 0) {
      for (const def of block.markDefs) {
        issues.push(`MarkDef: ${def._type} → ${def.href || "?"}`);
      }
    }
  }

  return issues.length > 0 ? issues : null;
}

// Analyze an i18n array field (array of { _key: lang, value: blocks[] })
function analyzeI18nField(i18nArray) {
  if (!Array.isArray(i18nArray)) return null;

  const result = {};
  let hasIssues = false;

  for (const entry of i18nArray) {
    const lang = entry._key;
    const issues = analyzeBlocks(entry.value);
    if (issues) {
      result[lang] = issues;
      hasIssues = true;
    }
  }

  return hasIssues ? result : null;
}

async function main() {
  console.log("Fetching all page documents...\n");

  const pages = await client.fetch(`*[_type == "page"]{
    _id, slug, title,
    description,
    sections[]{
      _type,
      description,
      note,
      items,
      intro,
      delivery
    }
  }`);

  console.log(`Found ${pages.length} pages\n`);

  let totalIssues = 0;

  for (const page of pages) {
    const pageTitle = page.title?.[0]?.value || page.slug || page._id;
    const findings = [];

    // page.description
    const descIssues = analyzeI18nField(page.description);
    if (descIssues) findings.push({ field: "page.description", issues: descIssues });

    // Sections
    if (page.sections) {
      for (let i = 0; i < page.sections.length; i++) {
        const section = page.sections[i];
        const prefix = `sections[${i}] (${section._type})`;

        if (section._type === "content") {
          const di = analyzeI18nField(section.description);
          if (di) findings.push({ field: `${prefix}.description`, issues: di });

          const ni = analyzeI18nField(section.note);
          if (ni) findings.push({ field: `${prefix}.note`, issues: ni });
        }

        if (section._type === "warnings" && section.items) {
          for (let j = 0; j < section.items.length; j++) {
            // Each item IS an i18n array (array of { _key, value })
            const ii = analyzeI18nField(section.items[j]);
            if (ii) findings.push({ field: `${prefix}.items[${j}]`, issues: ii });
          }
        }

        if (section._type === "history") {
          const ii = analyzeI18nField(section.intro);
          if (ii) findings.push({ field: `${prefix}.intro`, issues: ii });
        }

        if (section._type === "fairTrade") {
          const di = analyzeI18nField(section.description);
          if (di) findings.push({ field: `${prefix}.description`, issues: di });

          const deli = analyzeI18nField(section.delivery);
          if (deli) findings.push({ field: `${prefix}.delivery`, issues: deli });
        }
      }
    }

    if (findings.length > 0) {
      totalIssues += findings.length;
      console.log(`📄 ${pageTitle}`);
      for (const f of findings) {
        console.log(`  ⚠️  ${f.field}`);
        for (const [lang, issues] of Object.entries(f.issues)) {
          console.log(`      [${lang}] ${issues.join("; ")}`);
        }
      }
      console.log();
    }
  }

  if (totalIssues === 0) {
    console.log("✅ No rich formatting found in any target fields. Safe to convert to plain text.");
  } else {
    console.log(`\n⚠️  Found ${totalIssues} field(s) with rich formatting. Review above before converting.`);
  }
}

main().catch(console.error);
