/**
 * Migration: Clean up aboutyia page copy
 *
 * 1. Promote mission statement to page-level description
 * 2. Update activities table labels to new category names
 * 3. Update activities table values to match new nav groupings
 * 4. Add missing English translations
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/fix-aboutyia.mjs
 *
 * Add --dry-run to preview without writing.
 */

import { createClient } from "next-sanity";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

const DRY_RUN = process.argv.includes("--dry-run");

async function migrate() {
  console.log(DRY_RUN ? "\n[DRY RUN MODE]\n" : "\n[LIVE MODE]\n");

  const page = await client.fetch(`*[_type == "page" && id == "aboutyia"][0]`);
  if (!page) throw new Error("aboutyia page not found");

  const sections = [...page.sections];

  // ── 1. Promote mission to page description ──────────────────────

  const missionSection = sections.find((s) => s._key === "key222");
  let newDescription = page.description;

  if (missionSection?.description) {
    newDescription = missionSection.description;
    // Remove description from the section (title stays)
    const idx = sections.indexOf(missionSection);
    sections[idx] = { ...missionSection };
    delete sections[idx].description;
    console.log("=== 1. Promote mission statement to page description ===");
    console.log("  Moved mission paragraph from section → page.description");
    console.log("  Section 'Our Mission' kept as heading only");
  }

  // ── 2–4. Rewrite activities table ───────────────────────────────

  const activitiesIdx = sections.findIndex((s) => s._key === "key228");
  if (activitiesIdx !== -1) {
    console.log("\n=== 2. Rewrite activities table ===");

    const newRows = [
      {
        _key: "act-support",
        label: [
          { _key: "ja", value: "生活サポート" },
          { _key: "en", value: "Living Support" },
        ],
        value: [
          { _key: "ja", value: "多言語による生活相談、翻訳・通訳サービス、外国人防災" },
          { _key: "en", value: "Multilingual counseling, translation & interpretation, disaster preparedness" },
        ],
      },
      {
        _key: "act-learning",
        label: [
          { _key: "ja", value: "語学・講座" },
          { _key: "en", value: "Language & Classes" },
        ],
        value: [
          { _key: "ja", value: "日本語会話サロン、外国語講座、国際理解講座、日本語学習ハンドブック" },
          { _key: "en", value: "Japanese conversation salon, foreign language courses, global awareness seminars, Japanese study handbook" },
        ],
      },
      {
        _key: "act-events",
        label: [
          { _key: "ja", value: "イベント" },
          { _key: "en", value: "Events" },
        ],
        value: [
          { _key: "ja", value: "日本文化体験 & JFY、キッズフェスティバル、世界の料理教室" },
          { _key: "en", value: "Japanese Culture Experience & JFY, Kids Festival, World Cooking Class" },
        ],
      },
      {
        _key: "act-exchange",
        label: [
          { _key: "ja", value: "国際交流" },
          { _key: "en", value: "Global Exchange" },
        ],
        value: [
          { _key: "ja", value: "国際ユースフォーラム、ホームステイ・ビジット、英語ガイドツアー、フェアトレードコーヒー、姉妹都市交換学生" },
          { _key: "en", value: "International Youth Forum, Homestay & Home Visit, English Guide Tour, Fair Trade Coffee, Sister City Exchange Students" },
        ],
      },
      {
        _key: "act-other",
        label: [
          { _key: "ja", value: "その他" },
          { _key: "en", value: "Other" },
        ],
        value: [
          { _key: "ja", value: "情報誌発行、メールマガジン、ホームページ運営、ボランティア交流会" },
          { _key: "en", value: "Newsletter, email magazine, website management, volunteer exchange meetings" },
        ],
      },
    ];

    const oldSection = sections[activitiesIdx];
    console.log("  Old labels: " + oldSection.rows.map((r) => r.label.find((l) => l._key === "ja")?.value).join(", "));
    console.log("  New labels: " + newRows.map((r) => r.label.find((l) => l._key === "ja")?.value).join(", "));
    console.log("  Added English values for all rows");

    sections[activitiesIdx] = {
      ...oldSection,
      rows: newRows,
    };
  }

  // ── Preview ─────────────────────────────────────────────────────

  if (DRY_RUN) {
    console.log("\n[DRY RUN] No changes written.\n");
    return;
  }

  // ── Commit ──────────────────────────────────────────────────────

  const tx = client.transaction();
  tx.patch(page._id, {
    set: {
      description: newDescription,
      sections,
    },
  });

  const result = await tx.commit();
  console.log(`\nMigration complete. Transaction ID: ${result.transactionId}\n`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
