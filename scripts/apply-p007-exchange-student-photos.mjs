#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fail, logSummary, patchWithRevision, runSanityScript } from "./lib/sanity-tools.mjs";
import {
  DEFAULT_ATTACHMENTS_DIR,
  SISTER_CITY_PAGE_IDS,
  attachmentPlan,
  replaceExchangeStudentGallery,
  stableStringify,
} from "./lib/exchange-student-photos.mjs";

await runSanityScript({
  name: "Apply P-007 exchange-student photos",
  description: "Uploads attachment photos and replaces the Sister City exchange-student gallery.",
  async handler({ client, dryRun, args }) {
    const attachmentsDir = parseAttachmentsDir(args);
    const photos = attachmentPlan(attachmentsDir);
    const assetsByFilename = {};
    const assetResults = [];

    for (const photo of photos) {
      const { asset, status } = await getOrUploadImageAsset(client, photo.path, {
        dryRun,
        filename: photo.filename,
      });
      assetsByFilename[photo.filename] = asset;
      assetResults.push({ filename: photo.filename, status, assetId: asset._id });
    }

    const docs = await client.fetch(`*[_id in $ids]{_id,_rev,sections}`, {
      ids: SISTER_CITY_PAGE_IDS,
    });

    if (!docs?.length) {
      throw fail("Sister City page document was not found.", {
        fix: "Confirm the page-sistercity document exists in Sanity before rerunning.",
        context: { ids: SISTER_CITY_PAGE_IDS },
      });
    }

    let patched = 0;
    let skippedUnchanged = 0;
    const results = [];
    const orderedDocs = [...docs].sort(
      (a, b) => SISTER_CITY_PAGE_IDS.indexOf(a._id) - SISTER_CITY_PAGE_IDS.indexOf(b._id),
    );

    for (const doc of orderedDocs) {
      const replacement = replaceExchangeStudentGallery(doc.sections, assetsByFilename);
      const changed = stableStringify(doc.sections) !== stableStringify(replacement.sections);

      if (!changed) {
        skippedUnchanged += 1;
        results.push({ docId: doc._id, changed: false });
        continue;
      }

      await patchWithRevision(client, doc, { sections: replacement.sections }, { dryRun });
      patched += 1;
      results.push({ docId: doc._id, changed: true, imageCount: replacement.images.length });
    }

    logSummary({
      dryRun,
      attachmentsDir,
      photos: photos.length,
      found: docs.length,
      patched,
      skippedUnchanged,
      assets: assetResults,
      results,
    });
  },
});

function parseAttachmentsDir(args) {
  let attachmentsDir = DEFAULT_ATTACHMENTS_DIR;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--attachments-dir") {
      const value = args[index + 1];
      if (!value) {
        throw fail("Missing value for --attachments-dir.", {
          fix: "Pass --attachments-dir followed by the local attachments folder path.",
        });
      }
      attachmentsDir = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--attachments-dir=")) {
      attachmentsDir = arg.slice("--attachments-dir=".length);
      continue;
    }

    throw fail("Unknown argument for exchange-student photo script.", {
      fix: "Use --dry-run, --live, or --attachments-dir <path>.",
      context: { arg, args },
    });
  }

  return path.resolve(attachmentsDir);
}

async function getOrUploadImageAsset(client, filePath, { dryRun, filename }) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw fail("Attachment image was not found.", {
      fix: "Check that the attachments folder contains all expected exchange-student photos.",
      context: { filePath },
    });
  }

  const stat = fs.statSync(filePath);
  if (!stat.isFile()) {
    throw fail("Attachment path is not a file.", {
      fix: "Pass a folder containing image files, not nested folders or aliases.",
      context: { filePath },
    });
  }

  const sha1 = sha1File(filePath);
  const existing = await client.fetch(
    `*[_type == "sanity.imageAsset" && originalFilename == $filename]{
      _id,
      originalFilename,
      size,
      sha1hash,
      url
    }`,
    { filename },
  );
  const deterministic = (existing ?? []).filter(
    (asset) => asset.sha1hash === sha1 || asset.size === stat.size,
  );

  if (deterministic.length === 1) {
    console.log(`Using existing image asset: ${deterministic[0]._id}`);
    return { asset: deterministic[0], status: "reused" };
  }

  if ((existing ?? []).length > 0 && deterministic.length !== 1) {
    throw fail("Ambiguous Sanity image asset match.", {
      fix: "Use unique filenames or remove stale duplicate image assets before reusing by filename.",
      context: {
        filename,
        localSize: stat.size,
        localSha1: sha1,
        matches: existing.map((asset) => ({
          _id: asset._id,
          size: asset.size,
          sha1hash: asset.sha1hash,
        })),
      },
    });
  }

  if (dryRun) {
    console.log(`[dry-run] Would upload image asset: ${filename}`);
    return {
      asset: {
        _id: `image-${sha1}-dryrun-jpg`,
        dryRun: true,
        filename,
        size: stat.size,
        sha1hash: sha1,
      },
      status: "would-upload",
    };
  }

  const asset = await client.assets.upload("image", fs.createReadStream(filePath), {
    filename,
    contentType: imageContentType(filePath),
  });
  return { asset, status: "uploaded" };
}

function imageContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  throw fail("Unsupported attachment image type.", {
    fix: "Use JPG, JPEG, or PNG image attachments.",
    context: { filePath, ext },
  });
}

function sha1File(filePath) {
  return crypto.createHash("sha1").update(fs.readFileSync(filePath)).digest("hex");
}
