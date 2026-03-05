#!/usr/bin/env node
/**
 * Migrate image fields from filename strings to Sanity native image assets.
 *
 * For every document that stores an image as a plain filename string
 * (e.g. "honyaku.jpg"), this script:
 *   1. Finds the file under public/original/
 *   2. Uploads it to the Sanity asset pipeline
 *   3. Patches the document to replace the string with { _type: "image", asset: { _type: "reference", _ref } }
 *
 * Usage:  node scripts/migrate-images-to-sanity.mjs
 * Requires: SANITY_TOKEN with write access in .env.local
 */

import "./load-env.mjs";
import { createClient } from "@sanity/client";
import { basename, join } from "path";
import { readdirSync, readFileSync, createReadStream, statSync } from "fs";
import { lookup } from "mime-types";

// ── Sanity client (with write token) ────────────────────────────────
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

// ── Build local image index ─────────────────────────────────────────
const ORIGINAL_DIR = join(process.cwd(), "public", "original");
const imageIndex = {}; // lowercase basename → absolute path

function scanDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(full);
    } else if (/\.(jpe?g|png|gif|webp)$/i.test(entry.name)) {
      imageIndex[entry.name.toLowerCase()] = full;
    }
  }
}
scanDir(ORIGINAL_DIR);

// ── Upload cache (avoid uploading the same file twice) ──────────────
const uploadCache = {}; // lowercase filename → asset _ref

async function uploadImage(filename) {
  if (!filename || typeof filename !== "string") return null;

  const key = filename.toLowerCase();
  if (uploadCache[key]) return uploadCache[key];

  // Try exact match, then fuzzy (dash→space+parens)
  let localPath = imageIndex[key];
  if (!localPath) {
    const fuzzy = key.replace(/-(\d+)\./i, " ($1).");
    localPath = imageIndex[fuzzy];
  }
  // Try path-based: "sister-cities/corpus-christi.jpg"
  if (!localPath && filename.includes("/")) {
    const fullPath = join(ORIGINAL_DIR, filename);
    try {
      statSync(fullPath);
      localPath = fullPath;
    } catch { /* not found */ }
  }

  if (!localPath) {
    console.warn(`  ⚠ File not found locally: "${filename}"`);
    return null;
  }

  const contentType = lookup(localPath) || "application/octet-stream";
  console.log(`  ↑ Uploading ${filename} (${contentType})`);

  const asset = await client.assets.upload("image", createReadStream(localPath), {
    filename: basename(localPath),
    contentType,
  });

  const ref = asset._id;
  uploadCache[key] = ref;
  return ref;
}

/** Build a Sanity image object from an asset ref */
function imageObj(ref) {
  return {
    _type: "image",
    asset: { _type: "reference", _ref: ref },
  };
}

// ── Migrate each document type ──────────────────────────────────────

async function migrateCategories() {
  const docs = await client.fetch(`*[_type == "category" && defined(heroImage) && heroImage != ""]{ _id, heroImage }`);
  for (const doc of docs) {
    console.log(`\n📁 ${doc._id} heroImage: "${doc.heroImage}"`);
    const ref = await uploadImage(doc.heroImage);
    if (ref) {
      await client.patch(doc._id).set({ heroImage: imageObj(ref) }).commit();
      console.log(`  ✓ patched`);
    }
  }
}

async function migrateAnnouncements() {
  const docs = await client.fetch(`*[_type == "announcement" && defined(image) && image != ""]{ _id, image }`);
  for (const doc of docs) {
    console.log(`\n📁 ${doc._id} image: "${doc.image}"`);
    const ref = await uploadImage(doc.image);
    if (ref) {
      await client.patch(doc._id).set({ image: imageObj(ref) }).commit();
      console.log(`  ✓ patched`);
    }
  }
}

async function migrateSidebar() {
  const docs = await client.fetch(`*[_type == "sidebar"]{ _id, accessMap, counselingImage }`);
  for (const doc of docs) {
    const patches = {};

    if (doc.accessMap?.image && typeof doc.accessMap.image === "string") {
      console.log(`\n📁 ${doc._id} accessMap.image: "${doc.accessMap.image}"`);
      const ref = await uploadImage(doc.accessMap.image);
      if (ref) patches["accessMap.image"] = imageObj(ref);
    }

    if (doc.counselingImage && typeof doc.counselingImage === "string") {
      console.log(`\n📁 ${doc._id} counselingImage: "${doc.counselingImage}"`);
      const ref = await uploadImage(doc.counselingImage);
      if (ref) patches.counselingImage = imageObj(ref);
    }

    if (Object.keys(patches).length) {
      await client.patch(doc._id).set(patches).commit();
      console.log(`  ✓ patched`);
    }
  }
}

async function migrateHomepage() {
  const docs = await client.fetch(`*[_type == "homepage"]{ _id, hero, activityGrid, eventFlyers }`);
  for (const doc of docs) {
    const patches = {};

    // hero.image
    if (doc.hero?.image && typeof doc.hero.image === "string") {
      console.log(`\n📁 ${doc._id} hero.image: "${doc.hero.image}"`);
      const ref = await uploadImage(doc.hero.image);
      if (ref) patches["hero.image"] = imageObj(ref);
    }

    // activityGrid.images (array of strings → array of image objects)
    if (doc.activityGrid?.images?.length && typeof doc.activityGrid.images[0] === "string") {
      console.log(`\n📁 ${doc._id} activityGrid.images: [${doc.activityGrid.images.length} items]`);
      const newImages = [];
      for (const filename of doc.activityGrid.images) {
        const ref = await uploadImage(filename);
        if (ref) {
          newImages.push({ ...imageObj(ref), _key: crypto.randomUUID().slice(0, 8) });
        }
      }
      if (newImages.length) patches["activityGrid.images"] = newImages;
    }

    // eventFlyers (array of objects with string image fields)
    if (doc.eventFlyers?.length) {
      let changed = false;
      const newFlyers = [];
      for (const flyer of doc.eventFlyers) {
        const newFlyer = { ...flyer };
        for (const field of ["image", "imageJa", "imageEn"]) {
          if (flyer[field] && typeof flyer[field] === "string") {
            console.log(`  📁 eventFlyer.${field}: "${flyer[field]}"`);
            const ref = await uploadImage(flyer[field]);
            if (ref) {
              newFlyer[field] = imageObj(ref);
              changed = true;
            }
          }
        }
        newFlyers.push(newFlyer);
      }
      if (changed) patches.eventFlyers = newFlyers;
    }

    if (Object.keys(patches).length) {
      await client.patch(doc._id).set(patches).commit();
      console.log(`  ✓ patched homepage`);
    }
  }
}

async function migratePages() {
  const docs = await client.fetch(`*[_type == "page"]{ _id, images, sections }`);

  for (const doc of docs) {
    const patches = {};
    let changed = false;

    // page.images[] — array of imageFile objects with { file: string, caption }
    if (doc.images?.length) {
      let imgChanged = false;
      const newImages = [];
      for (const img of doc.images) {
        if (img.file && typeof img.file === "string") {
          console.log(`\n📁 ${doc._id} images[].file: "${img.file}"`);
          const ref = await uploadImage(img.file);
          if (ref) {
            newImages.push({ ...img, file: imageObj(ref) });
            imgChanged = true;
          } else {
            newImages.push(img);
          }
        } else {
          newImages.push(img);
        }
      }
      if (imgChanged) {
        patches.images = newImages;
        changed = true;
      }
    }

    // page.sections[] — various section types with nested images
    if (doc.sections?.length) {
      let sectionsChanged = false;
      const newSections = [];
      for (const sec of doc.sections) {
        const newSec = { ...sec };

        // content/gallery sections: images[].file
        if (sec.images?.length) {
          let secImgChanged = false;
          const newSecImages = [];
          for (const img of sec.images) {
            if (img.file && typeof img.file === "string") {
              console.log(`  📁 ${doc._id} section.images[].file: "${img.file}"`);
              const ref = await uploadImage(img.file);
              if (ref) {
                newSecImages.push({ ...img, file: imageObj(ref) });
                secImgChanged = true;
              } else {
                newSecImages.push(img);
              }
            } else {
              newSecImages.push(img);
            }
          }
          if (secImgChanged) {
            newSec.images = newSecImages;
            sectionsChanged = true;
          }
        }

        // sisterCities section: cities[].image
        if (sec._type === "sisterCities" && sec.cities?.length) {
          let citiesChanged = false;
          const newCities = [];
          for (const city of sec.cities) {
            if (city.image && typeof city.image === "string") {
              console.log(`  📁 ${doc._id} sisterCity.image: "${city.image}"`);
              const ref = await uploadImage(city.image);
              if (ref) {
                newCities.push({ ...city, image: imageObj(ref) });
                citiesChanged = true;
              } else {
                newCities.push(city);
              }
            } else {
              newCities.push(city);
            }
          }
          if (citiesChanged) {
            newSec.cities = newCities;
            sectionsChanged = true;
          }
        }

        // flyers section: items[].image/imageJa/imageEn
        if (sec._type === "flyers" && sec.items?.length) {
          let flyerChanged = false;
          const newItems = [];
          for (const item of sec.items) {
            const newItem = { ...item };
            for (const field of ["image", "imageJa", "imageEn"]) {
              if (item[field] && typeof item[field] === "string") {
                console.log(`  📁 ${doc._id} flyer.${field}: "${item[field]}"`);
                const ref = await uploadImage(item[field]);
                if (ref) {
                  newItem[field] = imageObj(ref);
                  flyerChanged = true;
                }
              }
            }
            newItems.push(newItem);
          }
          if (flyerChanged) {
            newSec.items = newItems;
            sectionsChanged = true;
          }
        }

        newSections.push(newSec);
      }
      if (sectionsChanged) {
        patches.sections = newSections;
        changed = true;
      }
    }

    if (changed) {
      await client.patch(doc._id).set(patches).commit();
      console.log(`  ✓ patched ${doc._id}`);
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("🔄 Starting image migration to Sanity...\n");
  console.log(`Found ${Object.keys(imageIndex).length} local images in public/original/\n`);

  await migrateCategories();
  await migrateAnnouncements();
  await migrateSidebar();
  await migrateHomepage();
  await migratePages();

  console.log("\n✅ Migration complete!");
  console.log(`Uploaded ${Object.keys(uploadCache).length} unique images to Sanity CDN.`);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
