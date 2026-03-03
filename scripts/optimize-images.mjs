#!/usr/bin/env node

/**
 * Optimize all images in public/original/
 *
 * - Resizes to max 1600px wide (preserves aspect ratio)
 * - Converts JPEG/PNG to optimized JPEG (quality 80)
 * - Skips GIF and already-small images
 * - Overwrites originals in-place
 *
 * Usage: node scripts/optimize-images.mjs
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";

const ORIGINAL_DIR = path.join(process.cwd(), "public", "original");
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 80;
const PNG_QUALITY = 80;
const MIN_SIZE = 50 * 1024; // Skip files under 50KB

let totalBefore = 0;
let totalAfter = 0;
let processed = 0;
let skipped = 0;

async function optimizeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (![".jpg", ".jpeg", ".png"].includes(ext)) {
    skipped++;
    return;
  }

  const stat = fs.statSync(filePath);
  if (stat.size < MIN_SIZE) {
    skipped++;
    totalBefore += stat.size;
    totalAfter += stat.size;
    return;
  }

  const sizeBefore = stat.size;
  totalBefore += sizeBefore;

  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    let pipeline = image;

    // Resize if wider than MAX_WIDTH
    if (metadata.width && metadata.width > MAX_WIDTH) {
      pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
    }

    let buffer;
    if (ext === ".png") {
      buffer = await pipeline.png({ quality: PNG_QUALITY, effort: 6 }).toBuffer();
    } else {
      buffer = await pipeline
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer();
    }

    // Only write if smaller
    if (buffer.length < sizeBefore) {
      fs.writeFileSync(filePath, buffer);
      totalAfter += buffer.length;
      const pct = ((1 - buffer.length / sizeBefore) * 100).toFixed(0);
      console.log(
        `  ${path.relative(ORIGINAL_DIR, filePath)}: ${fmt(sizeBefore)} -> ${fmt(buffer.length)} (-${pct}%)`
      );
    } else {
      totalAfter += sizeBefore;
      console.log(
        `  ${path.relative(ORIGINAL_DIR, filePath)}: ${fmt(sizeBefore)} (already optimal)`
      );
    }
    processed++;
  } catch (err) {
    console.error(`  ERROR: ${path.relative(ORIGINAL_DIR, filePath)}: ${err.message}`);
    totalAfter += sizeBefore;
    skipped++;
  }
}

function fmt(bytes) {
  if (bytes > 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  return (bytes / 1024).toFixed(0) + " KB";
}

async function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  console.log("Optimizing images in public/original/...\n");

  const files = await walkDir(ORIGINAL_DIR);
  for (const file of files) {
    await optimizeFile(file);
  }

  console.log(`\nDone! Processed: ${processed}, Skipped: ${skipped}`);
  console.log(`Total: ${fmt(totalBefore)} -> ${fmt(totalAfter)} (-${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%)`);
}

main().catch(console.error);
