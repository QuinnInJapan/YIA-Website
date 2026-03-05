/**
 * One-time script: Set optimal hotspots for all cover-fit images.
 *
 * Hotspot x,y are 0–1 fractions from top-left.
 * They control CSS object-position when the image is cropped by object-fit:cover.
 *
 * Usage:
 *   node scripts/set-hotspots.mjs --dry-run   (preview changes)
 *   node scripts/set-hotspots.mjs              (apply changes)
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
config({ path: ".env.local" });

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

const dryRun = process.argv.includes("--dry-run");

function hotspot(x, y, w = 0.5, h = 0.5) {
  return { _type: "sanity.imageHotspot", x, y, width: w, height: h };
}

// ── Category hero images (homepage program cards) ──────────────────

const categoryPatches = [
  {
    // 啓発事業 — Youth Forum presentation, speakers at podium on right
    id: "category-kehatsu",
    path: "heroImage.hotspot",
    value: hotspot(0.65, 0.55),
    label: "啓発事業 (kehatsu) — focus on speakers at podium",
  },
  {
    // 国際貢献 — Kimono try-on event, women center-right with parasols
    id: "category-kokusaikoken",
    path: "heroImage.hotspot",
    value: hotspot(0.55, 0.50),
    label: "国際貢献 (kokusaikoken) — center on kimono scene",
  },
  {
    // 交流事業 — Kids Halloween booth, activity at table
    id: "category-kouryu",
    path: "heroImage.hotspot",
    value: hotspot(0.55, 0.45),
    label: "交流事業 (kouryu) — center on booth activity",
  },
  {
    // 支援事業 — Traditional dance in gym, dancers in center
    id: "category-shien",
    path: "heroImage.hotspot",
    value: hotspot(0.45, 0.50),
    label: "支援事業 (shien) — center on dancers",
  },
];

// ── Page hero images ───────────────────────────────────────────────

const pagePatches = [
  {
    // 世界の料理教室 — Nepal cooking class, crowd around instructor
    id: "page-cooking",
    imageKey: "key168",
    value: hotspot(0.50, 0.40),
    label: "cooking — focus up to show faces",
  },
  {
    // 英語ガイドツアー — Group photo at temple, VERY tall portrait (3000x3999)
    // People are in lower 60%, need to pull focal point down significantly
    id: "page-englishguide",
    imageKey: "key145",
    value: hotspot(0.50, 0.65),
    label: "englishguide — pull down to show people (tall portrait)",
  },
  {
    // ホームステイ — Two guys at rocky coastline with natural arch
    id: "page-homestay",
    imageKey: "key158",
    value: hotspot(0.45, 0.40),
    label: "homestay — show arch formation + people",
  },
  {
    // キッズフェスティバル — Same Halloween booth image as kouryu
    id: "page-kids",
    imageKey: "key136",
    value: hotspot(0.55, 0.45),
    label: "kids — center on booth activity",
  },
  {
    // 日本文化体験 & JFY — Ikebana lesson, elderly woman + young girl
    id: "page-nihonbunka",
    imageKey: "key120",
    value: hotspot(0.60, 0.45),
    label: "nihonbunka — focus on subjects center-right",
  },
  {
    // 国際ユースフォーラム — Youth mingling at conference
    id: "page-youthfo",
    imageKey: "key110",
    value: hotspot(0.50, 0.45),
    label: "youthfo — center on youth group",
  },
];

// ── Execute ────────────────────────────────────────────────────────

async function run() {
  // Query which document IDs actually exist (published + drafts)
  const allIds = [
    ...categoryPatches.map((p) => p.id),
    ...pagePatches.map((p) => p.id),
  ];
  const draftIds = allIds.map((id) => `drafts.${id}`);
  const checkIds = [...allIds, ...draftIds];
  const existing = await client.fetch(
    `*[_id in $ids]._id`,
    { ids: checkIds }
  );
  const existingSet = new Set(existing);

  const mutations = [];

  // Category hotspots
  for (const p of categoryPatches) {
    for (const docId of [p.id, `drafts.${p.id}`]) {
      if (!existingSet.has(docId)) continue;
      mutations.push({
        patch: {
          id: docId,
          ifRevisionID: undefined,
          set: { [p.path]: p.value },
        },
      });
    }
    console.log(`${dryRun ? "[DRY RUN] " : ""}${p.label}`);
    console.log(`  → hotspot(${p.value.x}, ${p.value.y})`);
  }

  // Page hotspots — target images[_key=="xxx"].file.hotspot
  for (const p of pagePatches) {
    const path = `images[_key=="${p.imageKey}"].file.hotspot`;
    for (const docId of [p.id, `drafts.${p.id}`]) {
      if (!existingSet.has(docId)) continue;
      mutations.push({
        patch: {
          id: docId,
          set: { [path]: p.value },
        },
      });
    }
    console.log(`${dryRun ? "[DRY RUN] " : ""}${p.label}`);
    console.log(`  → hotspot(${p.value.x}, ${p.value.y})`);
  }

  if (dryRun) {
    console.log(`\n${mutations.length} mutations prepared (dry run — no changes made)`);
    return;
  }

  const result = await client.mutate(mutations, { returnDocuments: false });
  console.log(`\nDone — ${result.results.length} documents patched`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
