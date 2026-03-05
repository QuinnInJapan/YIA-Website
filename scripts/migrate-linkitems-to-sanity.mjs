#!/usr/bin/env node
/**
 * Migrate linkItem fields from local /docs/ URLs to Sanity native file assets.
 *
 * For every linkItem in a "links" section that has a local /docs/ URL:
 *   1. Uploads the file to Sanity
 *   2. Adds a `file` reference to the linkItem
 *   3. Clears the old `url` string
 *
 * Usage:  node scripts/migrate-linkitems-to-sanity.mjs
 * Requires: SANITY_TOKEN with write access in .env.local
 */

import "./load-env.mjs";
import { createClient } from "@sanity/client";
import { basename, join } from "path";
import { readdirSync, readFileSync, createReadStream } from "fs";
import { lookup } from "mime-types";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

// ── Build local file index ──────────────────────────────────────────
const DOCS_DIR = join(process.cwd(), "public", "docs");
const fileIndex = {};

for (const entry of readdirSync(DOCS_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    fileIndex[entry.name.toLowerCase()] = join(DOCS_DIR, entry.name);
  }
}

// ── Upload cache (reuse already-uploaded assets) ────────────────────
const uploadCache = {};

// Pre-populate cache from existing Sanity file assets
const existingAssets = await client.fetch('*[_type == "sanity.fileAsset"]{_id, originalFilename}');
for (const a of existingAssets) {
  if (a.originalFilename) {
    uploadCache[a.originalFilename.toLowerCase()] = a._id;
  }
}
console.log(`Found ${existingAssets.length} existing file assets in Sanity\n`);

async function uploadFile(urlPath) {
  if (!urlPath || typeof urlPath !== "string") return null;

  const filename = basename(urlPath);
  const key = filename.toLowerCase();

  if (uploadCache[key]) {
    console.log(`  ✓ Already uploaded: ${filename}`);
    return uploadCache[key];
  }

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

// ── Migrate linkItems in "links" sections ───────────────────────────

async function migrateLinkItems() {
  const pages = await client.fetch('*[_type == "page" && defined(sections)]{ _id, sections }');

  for (const doc of pages) {
    let sectionsChanged = false;
    const newSections = [];

    for (const sec of doc.sections) {
      if (sec._type === "links" && sec.items?.length) {
        let itemsChanged = false;
        const newItems = [];

        for (const item of sec.items) {
          if (isLocalDocPath(item.url)) {
            console.log(`\n📁 ${doc._id} linkItem: "${item.url}"`);
            const ref = await uploadFile(item.url);
            if (ref) {
              const { url, ...rest } = item;
              newItems.push({ ...rest, file: fileObj(ref) });
              itemsChanged = true;
              continue;
            }
          }
          newItems.push(item);
        }

        if (itemsChanged) {
          newSections.push({ ...sec, items: newItems });
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
  console.log("🔄 Starting linkItem migration to Sanity...\n");
  console.log(`Found ${Object.keys(fileIndex).length} local files in public/docs/\n`);

  await migrateLinkItems();

  const newUploads = Object.keys(uploadCache).length - existingAssets.length;
  console.log(`\n✅ Migration complete!`);
  console.log(`Uploaded ${Math.max(0, newUploads)} new files to Sanity CDN.`);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
