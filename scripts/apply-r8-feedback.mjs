#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@sanity/client";

dotenv.config({ path: ".env.local", quiet: true });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_TOKEN;
const flyerPath = process.argv[2] ?? process.env.R8_FLYER_PATH;

if (!projectId || !dataset || !token) {
  console.error("Missing Sanity environment variables.");
  process.exit(1);
}

if (!flyerPath) {
  console.error("Usage: node scripts/apply-r8-feedback.mjs /path/to/r8-flyer.pdf");
  process.exit(1);
}

const flyerFilename = path.basename(flyerPath);

if (!fs.existsSync(flyerPath)) {
  console.error(`Flyer PDF not found: ${flyerPath}`);
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

function i18n(jaValue, enValue) {
  return [
    { _key: "ja", value: jaValue },
    { _key: "en", value: enValue },
  ];
}

function cell(jaValue, enValue = "") {
  return i18n(jaValue, enValue);
}

function jaValue(field) {
  return field?.find((entry) => entry._key === "ja")?.value ?? "";
}

function findSection(doc, key, type) {
  const section = doc.sections?.find((item) => item._key === key && item._type === type);
  if (!section) throw new Error(`Missing ${type} section ${key} on ${doc._id}`);
  return section;
}

async function getOrUploadFlyer() {
  const existing = await client.fetch(
    `*[_type == "sanity.fileAsset" && originalFilename == $filename][0]{
      _id,
      originalFilename,
      url
    }`,
    { filename: flyerFilename },
  );

  if (existing?._id) {
    console.log(`Using existing flyer asset: ${existing._id}`);
    return existing;
  }

  const asset = await client.assets.upload("file", fs.createReadStream(flyerPath), {
    filename: flyerFilename,
    contentType: "application/pdf",
  });
  console.log(`Uploaded flyer asset: ${asset._id}`);
  return asset;
}

function updateCounselingSections(doc, flyerAssetId) {
  const sections = structuredClone(doc.sections ?? []);
  const guide = findSection({ ...doc, sections }, "key33", "labelTable");
  const languageRow = guide.rows.find((row) => jaValue(row.label) === "対応言語");
  if (!languageRow) throw new Error("Missing counseling language row");

  languageRow.value = i18n(
    "日本語、英語、ネパール語、ポルトガル語、韓国語、中国語、タガログ語、ベトナム語\n※その他の言語については、翻訳機を使って、月曜日−金曜日(土日祝日休み)、9:00−17:00で対応します。",
    "Japanese, English, Nepali, Portuguese, Korean, Chinese, Tagalog, Vietnamese\nFor other languages, translation machines are used. Available Monday-Friday (closed weekends/holidays), 9:00-17:00.",
  );

  const schedule = findSection({ ...doc, sections }, "key39", "table");
  const rows = (schedule.rows ?? []).filter((row) => row._key !== "r8-nepali-thursday");
  for (const row of rows) {
    const day = jaValue(row.cells?.[0]);
    if (day === "水曜日") {
      row.cells[2] = cell("中国語", "Chinese");
    }
  }

  const thursdayIndex = rows.findIndex((row) => jaValue(row.cells?.[0]) === "木曜日");
  if (thursdayIndex < 0) throw new Error("Missing Thursday counseling row");
  rows.splice(thursdayIndex + 1, 0, {
    _key: "r8-nepali-thursday",
    cells: [
      cell("木曜日", "Thursday"),
      cell("10:00〜12:00", "10:00-12:00"),
      cell("ネパール語", "Nepali"),
    ],
  });
  schedule.rows = rows;

  const downloads = findSection({ ...doc, sections }, "key40", "links");
  const flyer = downloads.items?.find((item) => item._key === "key41") ?? downloads.items?.[0];
  if (!flyer) throw new Error("Missing counseling flyer link");
  flyer.file = {
    _type: "file",
    asset: { _type: "reference", _ref: flyerAssetId },
  };
  flyer.fileType = "PDF";
  flyer.label = i18n("チラシ（R8）", "Flyer (R8)");
  flyer.type = "document";

  return sections;
}

function updateYouthSections(doc) {
  const sections = structuredClone(doc.sections ?? []);
  const guide = findSection({ ...doc, sections }, "key111", "labelTable");
  const rows = (guide.rows ?? []).filter((row) => row._key !== "r8-youth-date");
  const insertAt = Math.max(
    1,
    rows.findIndex((row) => row._key === "key112") + 1,
  );
  rows.splice(insertAt, 0, {
    _key: "r8-youth-date",
    label: i18n("日時", "Date / Time"),
    value: i18n("2026年8月2日（日）", "Sunday, August 2, 2026"),
  });
  guide.rows = rows;
  return sections;
}

function updateKidsSections(doc) {
  const sections = structuredClone(doc.sections ?? []);
  const schedule = findSection({ ...doc, sections }, "key137", "labelTable");
  schedule.title = i18n("2026年度スケジュール", "2026 Schedule");
  const dateRow = schedule.rows?.find((row) => jaValue(row.label) === "日時");
  if (!dateRow) throw new Error("Missing kids festival date row");
  dateRow.value = i18n("2026年10月18日（日）", "Sunday, October 18, 2026");
  return sections;
}

function updateNavigationCategories(nav) {
  let updated = false;
  const categories = structuredClone(nav.categories ?? []);

  for (const category of categories) {
    for (const item of category.items ?? []) {
      if (item.pageRef?._ref === "page-nihongo-handbook") {
        item.hidden = true;
        updated = true;
      }
    }
  }

  if (!updated) throw new Error("Navigation item page-nihongo-handbook not found");
  return categories;
}

async function patchWithRevision(docId, rev, set) {
  await client.patch(docId).ifRevisionId(rev).set(set).commit();
}

async function main() {
  const flyer = await getOrUploadFlyer();
  const data = await client.fetch(`{
    "counseling": *[_id == "page-seikatsusodan"][0],
    "youth": *[_id == "page-youthfo"][0],
    "kids": *[_id == "page-kids"][0],
    "navigation": *[_type == "navigation"][0]
  }`);

  if (!data.counseling || !data.youth || !data.kids || !data.navigation) {
    throw new Error("Missing one or more required Sanity documents");
  }

  await patchWithRevision(data.counseling._id, data.counseling._rev, {
    sections: updateCounselingSections(data.counseling, flyer._id),
  });
  console.log("Updated multilingual counseling page");

  await patchWithRevision(data.youth._id, data.youth._rev, {
    sections: updateYouthSections(data.youth),
  });
  console.log("Updated International Youth Forum date");

  await patchWithRevision(data.kids._id, data.kids._rev, {
    sections: updateKidsSections(data.kids),
  });
  console.log("Updated Kids Festival date");

  await patchWithRevision(data.navigation._id, data.navigation._rev, {
    categories: updateNavigationCategories(data.navigation),
  });
  console.log("Hid Japanese study and living handbook from navigation");
}

main().catch((err) => {
  console.error(`Migration failed: ${err?.message ?? "Unknown error"}`);
  process.exit(1);
});
