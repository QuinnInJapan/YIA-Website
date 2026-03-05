#!/usr/bin/env node
/**
 * Migrate document/file fields from local path strings to Sanity native file assets.
 *
 * For every document that stores a file URL as a local path (e.g. "/docs/teikan.pdf"),
 * this script:
 *   1. Finds the file under public/docs/
 *   2. Uploads it to the Sanity asset pipeline
 *   3. Patches the document to add a `file` reference (documentLink) or replace
 *      string fields with file objects (groupScheduleRow)
 *
 * Usage:  node scripts/migrate-files-to-sanity.mjs
 * Requires: SANITY_TOKEN with write access in .env.local
 */

import "./load-env.mjs";
import { createClient } from "@sanity/client";
import { basename, join } from "path";
import { readdirSync, readFileSync, createReadStream, statSync } from "fs";
import { lookup } from "mime-types";
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

// ── Build local file index ──────────────────────────────────────────
const DOCS_DIR = join(process.cwd(), "public", "docs");
const fileIndex = {}; // lowercase basename → absolute path

for (const entry of readdirSync(DOCS_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    fileIndex[entry.name.toLowerCase()] = join(DOCS_DIR, entry.name);
  }
}

// ── Upload cache ────────────────────────────────────────────────────
const uploadCache = {}; // lowercase basename → asset _ref

async function uploadFile(urlPath) {
  if (!urlPath || typeof urlPath !== "string") return null;

  // Extract filename from path like "/docs/teikan.pdf"
  const filename = basename(urlPath);
  const key = filename.toLowerCase();

  if (uploadCache[key]) return uploadCache[key];

  const localPath = fileIndex[key];
  if (!localPath) {
    console.warn(`  ⚠ File not found locally: "${urlPath}" (looked for ${key})`);
    return null;
  }

  const contentType = lookup(localPath) || "application/octet-stream";
  console.log(`  ↑ Uploading ${filename} (${contentType})`);

  const asset = await client.assets.upload("file", createReadStream(localPath), {
    filename,
    contentType,
  });

  uploadCache[key] = asset._id;
  return asset._id;
}

function fileObj(ref) {
  return {
    _type: "file",
    asset: { _type: "reference", _ref: ref },
  };
}

function isLocalDocPath(url) {
  return typeof url === "string" && url.startsWith("/docs/");
}

// ── Migrate documentLink fields ─────────────────────────────────────

async function migrateDocumentLinks() {
  // Find all documents that have documentLink objects with local /docs/ URLs
  // These appear in: sidebar.documents[], sidebar.activityRequestForm, page.sections[].documents[], announcement.documents[]

  // 1. Sidebar
  const sidebars = await client.fetch(`*[_type == "sidebar"]{ _id, documents, activityRequestForm }`);
  for (const doc of sidebars) {
    const patches = {};
    let changed = false;

    if (doc.documents?.length) {
      const newDocs = [];
      for (const d of doc.documents) {
        if (isLocalDocPath(d.url)) {
          console.log(`\n📁 ${doc._id} document: "${d.url}"`);
          const ref = await uploadFile(d.url);
          if (ref) {
            newDocs.push({ ...d, file: fileObj(ref) });
            changed = true;
            continue;
          }
        }
        newDocs.push(d);
      }
      if (changed) patches.documents = newDocs;
    }

    if (doc.activityRequestForm && isLocalDocPath(doc.activityRequestForm.url)) {
      console.log(`\n📁 ${doc._id} activityRequestForm: "${doc.activityRequestForm.url}"`);
      const ref = await uploadFile(doc.activityRequestForm.url);
      if (ref) {
        patches.activityRequestForm = { ...doc.activityRequestForm, file: fileObj(ref) };
        changed = true;
      }
    }

    if (changed) {
      await client.patch(doc._id).set(patches).commit();
      console.log(`  ✓ patched ${doc._id}`);
    }
  }

  // 2. Announcements
  const announcements = await client.fetch(`*[_type == "announcement" && defined(documents)]{ _id, documents }`);
  for (const doc of announcements) {
    let changed = false;
    const newDocs = [];
    for (const d of doc.documents) {
      if (isLocalDocPath(d.url)) {
        console.log(`\n📁 ${doc._id} document: "${d.url}"`);
        const ref = await uploadFile(d.url);
        if (ref) {
          newDocs.push({ ...d, file: fileObj(ref) });
          changed = true;
          continue;
        }
      }
      newDocs.push(d);
    }
    if (changed) {
      await client.patch(doc._id).set({ documents: newDocs }).commit();
      console.log(`  ✓ patched ${doc._id}`);
    }
  }

  // 3. Pages with sections containing documents
  const pages = await client.fetch(`*[_type == "page"]{ _id, sections }`);
  for (const doc of pages) {
    if (!doc.sections?.length) continue;
    let sectionsChanged = false;
    const newSections = [];

    for (const sec of doc.sections) {
      if (sec.documents?.length) {
        let secChanged = false;
        const newDocs = [];
        for (const d of sec.documents) {
          if (isLocalDocPath(d.url)) {
            console.log(`\n📁 ${doc._id} section.document: "${d.url}"`);
            const ref = await uploadFile(d.url);
            if (ref) {
              newDocs.push({ ...d, file: fileObj(ref) });
              secChanged = true;
              continue;
            }
          }
          newDocs.push(d);
        }
        if (secChanged) {
          newSections.push({ ...sec, documents: newDocs });
          sectionsChanged = true;
          continue;
        }
      }
      newSections.push(sec);
    }

    if (sectionsChanged) {
      await client.patch(doc._id).set({ sections: newSections }).commit();
      console.log(`  ✓ patched ${doc._id}`);
    }
  }
}

// ── Migrate groupScheduleRow fields ─────────────────────────────────

async function migrateGroupScheduleRows() {
  // groupScheduleRow appears in page.sections[] of type "groupSchedule"
  const pages = await client.fetch(`*[_type == "page" && defined(sections)]{ _id, sections }`);

  for (const doc of pages) {
    let sectionsChanged = false;
    const newSections = [];

    for (const sec of doc.sections) {
      if (sec._type === "groupSchedule" && sec.groups?.length) {
        let groupsChanged = false;
        const newGroups = [];

        for (const g of sec.groups) {
          const newGroup = { ...g };
          let gChanged = false;

          // schedule_pdf → schedulePdf (file)
          if (isLocalDocPath(g.schedule_pdf)) {
            console.log(`\n📁 ${doc._id} group.schedule_pdf: "${g.schedule_pdf}"`);
            const ref = await uploadFile(g.schedule_pdf);
            if (ref) {
              newGroup.schedulePdf = fileObj(ref);
              delete newGroup.schedule_pdf;
              gChanged = true;
            }
          }

          // photos_pdf → photosPdf (file)
          if (isLocalDocPath(g.photos_pdf)) {
            console.log(`\n📁 ${doc._id} group.photos_pdf: "${g.photos_pdf}"`);
            const ref = await uploadFile(g.photos_pdf);
            if (ref) {
              newGroup.photosPdf = fileObj(ref);
              delete newGroup.photos_pdf;
              gChanged = true;
            }
          }

          newGroups.push(newGroup);
          if (gChanged) groupsChanged = true;
        }

        if (groupsChanged) {
          newSections.push({ ...sec, groups: newGroups });
          sectionsChanged = true;
          continue;
        }
      }
      newSections.push(sec);
    }

    if (sectionsChanged) {
      await client.patch(doc._id).set({ sections: newSections }).commit();
      console.log(`  ✓ patched ${doc._id}`);
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("🔄 Starting file migration to Sanity...\n");
  console.log(`Found ${Object.keys(fileIndex).length} local files in public/docs/\n`);

  await migrateDocumentLinks();
  await migrateGroupScheduleRows();

  console.log("\n✅ Migration complete!");
  console.log(`Uploaded ${Object.keys(uploadCache).length} unique files to Sanity CDN.`);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
