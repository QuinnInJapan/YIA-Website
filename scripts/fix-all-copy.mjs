/**
 * Migration: Fix copy across all pages
 *
 * Rewrites descriptions, adds missing EN translations, fixes stiff/bureaucratic
 * language, adds missing section titles, updates old category terms.
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/fix-all-copy.mjs
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

// ── Helpers ─────────────────────────────────────────────────────

/** Create a portable text block from plain text, reusing existing keys if provided */
function block(text, existingBlock) {
  return {
    _key: existingBlock?._key || crypto.randomUUID().slice(0, 11),
    _type: "block",
    children: [{
      _key: existingBlock?.children?.[0]?._key || crypto.randomUUID().slice(0, 11),
      _type: "span",
      marks: [],
      text,
    }],
    markDefs: [],
    style: "normal",
  };
}

/** Build an i18n block content array */
function i18nBlocks(ja, en, existing) {
  const jaExisting = existing?.find(d => d._key === "ja")?.value?.[0];
  const enExisting = existing?.find(d => d._key === "en")?.value?.[0];
  return [
    { _key: "ja", value: [block(ja, jaExisting)] },
    { _key: "en", value: [block(en, enExisting)] },
  ];
}

/** Build an i18n string array */
function i18nStr(ja, en) {
  return [{ _key: "ja", value: ja }, { _key: "en", value: en }];
}

// ── Page fixes ──────────────────────────────────────────────────

async function fixAll() {
  console.log(DRY_RUN ? "\n[DRY RUN MODE]\n" : "\n[LIVE MODE]\n");

  const allPages = await client.fetch(`*[_type == "page" && !(_id match "drafts.*")]`);
  const pageMap = Object.fromEntries(allPages.map(p => [p.id, p]));
  const tx = client.transaction();

  // ── englishguide ────────────────────────────────────────────

  {
    const p = pageMap["englishguide"];
    console.log("=== englishguide ===");

    // Shorten EN title
    const newTitle = p.title.map(t => t._key === "en" ? { ...t, value: "English Guide Tour" } : t);
    console.log("  Title EN: Yokosuka Sightseeing Tour with English Guide → English Guide Tour");

    // Rewrite description
    const newDesc = i18nBlocks(
      "横須賀市やその周辺の観光地を英語で案内するガイドツアーを年2回実施しています。外国人との交流を深めながら、地域の魅力を再発見できるプログラムです。英語ガイドの育成にも取り組んでいます。",
      "Twice a year, we run English-guided tours of sightseeing spots in and around Yokosuka. It's a chance for locals and international residents to explore together while rediscovering the area's charm. We also train volunteer English guides.",
      p.description,
    );
    console.log("  Description: rewritten (warmer tone)");

    if (!DRY_RUN) tx.patch(p._id, { set: { title: newTitle, description: newDesc } });
  }

  // ── gaikokugo ───────────────────────────────────────────────

  {
    const p = pageMap["gaikokugo"];
    console.log("\n=== gaikokugo ===");

    // Rewrite description
    const newDesc = i18nBlocks(
      "横須賀国際交流協会では、外国人と日本人が一緒に学ぶ「外国語会話教室」を開催しています。実践的な会話スキルを身につけながら、異文化交流も楽しめます。",
      "YIA offers foreign language conversation classes where Japanese and international residents learn together, with a focus on practical conversation skills and cross-cultural exchange.",
      p.description,
    );
    console.log("  Description: rewritten (warmer tone)");

    // Add title to untitled notes section (key99)
    const sections = p.sections.map(s => {
      if (s._key !== "key99") return s;
      console.log("  Section key99: added title 'お知らせ / Important Notes'");
      return { ...s, title: i18nStr("お知らせ", "Important Notes") };
    });

    if (!DRY_RUN) tx.patch(p._id, { set: { description: newDesc, sections } });
  }

  // ── homestay ────────────────────────────────────────────────

  {
    const p = pageMap["homestay"];
    console.log("\n=== homestay ===");

    // Tighten JA, keep EN warm
    const newDesc = i18nBlocks(
      "横須賀国際交流協会では、さまざまな団体からのホームステイ・ホームビジットの紹介をしています。海外から来た方にとっても、受け入れ側にとっても、かけがえのない交流体験です。",
      "YIA introduces homestay and home visit opportunities from various organizations. These are valuable experiences for both visitors from abroad and host families, providing wonderful cultural exchange.",
      p.description,
    );
    console.log("  Description: tightened JA (removed wordiness)");

    if (!DRY_RUN) tx.patch(p._id, { set: { description: newDesc } });
  }

  // ── honyaku ─────────────────────────────────────────────────

  {
    const p = pageMap["honyaku"];
    console.log("\n=== honyaku ===");

    // Add missing page description
    const newDesc = i18nBlocks(
      "行政書類の翻訳や通訳の派遣サービスを提供しています。窓口での翻訳と、出張による通訳・翻訳の2つのサービスがあります。",
      "We offer document translation and on-site interpretation services. Available as walk-in translation at our office or on-location interpretation and translation.",
    );
    console.log("  Description: added (was empty)");

    // Fix section titles
    const sections = p.sections.map(s => {
      if (s._key === "counter-translation") {
        const newTitle = s.title.map(t => t._key === "en" ? { ...t, value: "Walk-In Translation" } : t);
        console.log("  Section title: Translation (Counter Reception) → Walk-In Translation");
        return { ...s, title: newTitle };
      }
      if (s._key === "interpretation-dispatch") {
        const newTitle = s.title.map(t => t._key === "en" ? { ...t, value: "On-Site Interpretation & Translation" } : t);
        console.log("  Section title: Interpretation & Translation Dispatch → On-Site Interpretation & Translation");
        return { ...s, title: newTitle };
      }
      return s;
    });

    if (!DRY_RUN) tx.patch(p._id, { set: { description: newDesc, sections } });
  }

  // ── kaiinn ──────────────────────────────────────────────────

  {
    const p = pageMap["kaiinn"];
    console.log("\n=== kaiinn ===");

    // Add EN description
    const newDesc = i18nBlocks(
      p.description.find(d => d._key === "ja").value[0].children[0].text,
      "We are looking for new members who want to join our activities or support YIA's mission. Everyone is welcome — individuals, families, students, and organizations.",
      p.description,
    );
    console.log("  Description: added EN");

    const sections = p.sections.map(s => {
      // Member Types — add EN labels and values
      if (s._key === "key276") {
        console.log("  Member Types: added all EN labels and values");
        const newRows = s.rows.map(r => {
          const jaLabel = r.label.find(l => l._key === "ja")?.value;
          const translations = {
            "正会員": {
              label: "Regular Member",
              value: "Individuals who support YIA's mission of promoting international exchange and community enrichment in Yokosuka.",
            },
            "家族会員": {
              label: "Family Member",
              value: "Family members living with a regular member who also support YIA's mission.",
            },
            "準会員": {
              label: "Associate Member",
              value: "Students (middle school through graduate school) and foreign nationals who are interested in and actively participate in YIA's activities.",
            },
            "賛助会員": {
              label: "Supporting Member",
              value: "Individuals or organizations that support YIA's activities through financial contributions.",
            },
          };
          const t = translations[jaLabel];
          if (!t) return r;
          return {
            ...r,
            label: [...r.label.filter(l => l._key !== "en"), { _key: "en", value: t.label }],
            value: [...r.value.filter(v => v._key !== "en"), { _key: "en", value: t.value }],
          };
        });
        return { ...s, rows: newRows };
      }

      // How to Join — add EN description
      if (s._key === "key282") {
        console.log("  How to Join: added EN description");
        const jaText = s.description?.find(d => d._key === "ja")?.value?.[0]?.children?.[0]?.text;
        const newSectionDesc = i18nBlocks(
          jaText,
          "To join, please fill out a registration form and submit it to the YIA office in person, by mail, email, or fax. Your membership will be confirmed once your annual fee is received.",
          s.description,
        );
        return { ...s, description: newSectionDesc };
      }

      // Privacy section — add title
      if (s._key === "key292") {
        console.log("  Privacy section: added title");
        return { ...s, title: i18nStr("個人情報について", "Privacy") };
      }

      return s;
    });

    if (!DRY_RUN) tx.patch(p._id, { set: { description: newDesc, sections } });
  }

  // ── kaiwasalon ──────────────────────────────────────────────

  {
    const p = pageMap["kaiwasalon"];
    console.log("\n=== kaiwasalon ===");

    const newDesc = i18nBlocks(
      "地域に住む外国籍市民を対象に、日本語の会話・読み書きを楽しく学べるボランティア教室です。文化交流や日常生活の相談など、各グループの特色を生かした活動を行っています。",
      "Free Japanese conversation classes for international residents, run by volunteer groups. Learn to speak, read, and write Japanese in a friendly, welcoming setting. Groups also offer cultural exchange and everyday life advice.",
      p.description,
    );
    console.log("  Description: rewritten (both JA and EN)");

    if (!DRY_RUN) tx.patch(p._id, { set: { description: newDesc } });
  }

  // ── kids ────────────────────────────────────────────────────

  {
    const p = pageMap["kids"];
    console.log("\n=== kids ===");

    const newDesc = i18nBlocks(
      "日本と外国の親子が一緒に楽しむイベントです。毎年「ヴェルクよこすか」でゲーム、歌コンテスト、ビンゴなど、楽しさいっぱいのプログラムを実施しています。",
      "A fun annual event where Japanese and international families come together for games, singing contests, bingo, and more at Werk Yokosuka.",
      p.description,
    );
    console.log("  Description: rewritten (removed 国際貢献, warmer tone)");

    if (!DRY_RUN) tx.patch(p._id, { set: { description: newDesc } });
  }

  // ── kokusairikai ────────────────────────────────────────────

  {
    const p = pageMap["kokusairikai"];
    console.log("\n=== kokusairikai ===");

    const newDesc = i18nBlocks(
      "学校の「総合的な学習の時間」などの一環として、市内外の学校や大学、自治会学習センターへ外国人講師を派遣し、各国の文化・習慣を紹介する講座を行っています。",
      "We send international guest instructors to schools, universities, and community centers in and around Yokosuka to lead cultural awareness workshops. Students learn about traditions and daily life in countries around the world.",
      p.description,
    );
    console.log("  Description: rewritten (removed circular phrasing, clarified 総合的な学習)");

    if (!DRY_RUN) tx.patch(p._id, { set: { description: newDesc } });
  }

  // ── nihonbunka ──────────────────────────────────────────────

  {
    const p = pageMap["nihonbunka"];
    console.log("\n=== nihonbunka ===");

    const newDesc = i18nBlocks(
      "生け花、折り紙、書道、着物の着付け、三味線など、日本の伝統文化を体験できるプログラムです。主に外国籍市民を対象に、日本文化に親しむ機会を提供しています。",
      "Try ikebana, origami, calligraphy, kimono dressing, shamisen, and more. These hands-on workshops are designed mainly for international residents and are a great way to experience Japanese traditions firsthand.",
      p.description,
    );
    console.log("  Description: rewritten (removed 'touching Japanese culture')");

    if (!DRY_RUN) tx.patch(p._id, { set: { description: newDesc } });
  }

  // ── sanjyokaiin ─────────────────────────────────────────────

  {
    const p = pageMap["sanjyokaiin"];
    console.log("\n=== sanjyokaiin ===");

    // Rewrite JA (less deferential) + add EN
    const newDesc = i18nBlocks(
      "多くの賛助会員の皆さまにご支援いただいています。ありがとうございます。",
      "YIA is grateful for the support of our corporate and organizational members.",
      p.description,
    );
    console.log("  Description: simplified JA, added EN");

    // Add section title to directory list
    const sections = p.sections.map(s => {
      if (s._key === "key293") {
        console.log("  Directory section: added title");
        return { ...s, title: i18nStr("賛助会員", "Supporting Members") };
      }
      return s;
    });

    if (!DRY_RUN) tx.patch(p._id, { set: { description: newDesc, sections } });
  }

  // ── seikatsusodan ───────────────────────────────────────────

  {
    const p = pageMap["seikatsusodan"];
    console.log("\n=== seikatsusodan ===");

    const newDesc = i18nBlocks(
      "横須賀国際交流協会では、ヴェルクよこすかの事務局に相談窓口を設け、外国籍市民の生活に関するさまざまな相談に対応しています。相談は無料です（一部の専門的な相談は有料となる場合があります）。秘密は厳守いたします。",
      "YIA offers free, confidential multilingual counseling at our office in Werk Yokosuka. If you need help with daily life in Japan — from paperwork to everyday questions — please get in touch. Some specialized consultations may involve a fee.",
      p.description,
    );
    console.log("  Description: rewritten (fixed 'counseling corner', clarified fees)");

    if (!DRY_RUN) tx.patch(p._id, { set: { description: newDesc } });
  }

  // ── sistercity ──────────────────────────────────────────────

  {
    const p = pageMap["sistercity"];
    console.log("\n=== sistercity ===");

    // Fix page-level EN description
    const newDesc = i18nBlocks(
      p.description.find(d => d._key === "ja").value[0].children[0].text,
      "A student exchange program with Yokosuka's sister cities. Each summer, high school and university students travel abroad for homestays and cultural experiences. We also welcome students from sister cities into Yokosuka host families.",
      p.description,
    );
    console.log("  Description: rewritten EN (removed 'dispatched')");

    const sections = p.sections.map(s => {
      // Dispatch — add EN description + EN captions
      if (s._key === "key190") {
        console.log("  Dispatch: added EN description + EN image captions");
        const newSectionDesc = i18nBlocks(
          "毎年夏に姉妹都市へ学生を派遣します。",
          "Every summer, students travel to our sister cities for cultural exchange.",
        );
        const captionMap = {
          "2026年度派遣学生": "2026 exchange students",
          "ブレストでバディとマカロン作り": "Making macarons with buddies in Brest",
          "フリマントルでの活動": "Activities in Fremantle",
          "市長表敬訪問": "Courtesy visit to the mayor",
          "ミッドケントカレッジでティータイム": "Tea time at MidKent College",
        };
        const images = s.images?.map(img => {
          const jaCaption = img.caption?.find(c => c._key === "ja")?.value;
          const enCaption = captionMap[jaCaption];
          if (!enCaption) return img;
          return {
            ...img,
            caption: [...(img.caption || []).filter(c => c._key !== "en"), { _key: "en", value: enCaption }],
          };
        });
        return { ...s, description: newSectionDesc, images };
      }

      // Host Family — add EN description + EN captions
      if (s._key === "key199") {
        console.log("  Host Family: added EN description + EN image captions");
        const newSectionDesc = i18nBlocks(
          "姉妹都市からの交換学生を横須賀のホストファミリーが受け入れます。",
          "Yokosuka host families welcome exchange students from our sister cities.",
        );
        const captionMap = {
          "ホストファミリーとたこ焼き体験": "Making takoyaki with host family",
          "渋谷スクランブル交差点": "Shibuya Scramble Crossing",
          "長野県八島湿原への旅行": "Trip to Yashima Wetlands, Nagano",
        };
        const images = s.images?.map(img => {
          const jaCaption = img.caption?.find(c => c._key === "ja")?.value;
          const enCaption = captionMap[jaCaption];
          if (!enCaption) return img;
          return {
            ...img,
            caption: [...(img.caption || []).filter(c => c._key !== "en"), { _key: "en", value: enCaption }],
          };
        });
        return { ...s, description: newSectionDesc, images };
      }

      // How to Join — add EN values
      if (s._key === "key203") {
        console.log("  How to Join: added EN values");
        const newRows = s.rows.map(r => {
          const jaLabel = r.label.find(l => l._key === "ja")?.value;
          if (jaLabel === "日時") {
            return { ...r, value: [...r.value.filter(v => v._key !== "en"), { _key: "en", value: "March 26 (Thu) 4:00–5:30 PM" }] };
          }
          if (jaLabel === "会場") {
            return { ...r, value: [...r.value.filter(v => v._key !== "en"), { _key: "en", value: "Werk Yokosuka, 6F Hall" }] };
          }
          return r;
        });
        return { ...s, rows: newRows };
      }

      return s;
    });

    if (!DRY_RUN) tx.patch(p._id, { set: { description: newDesc, sections } });
  }

  // ── youthfo ─────────────────────────────────────────────────

  {
    const p = pageMap["youthfo"];
    console.log("\n=== youthfo ===");

    const newDesc = i18nBlocks(
      "横須賀市に在住・在学する日本人・外国人の高校生を対象に、毎年テーマに沿ったスピーチやスキットの発表を行い、交流会を開催しています。異文化理解と国際感覚を育むイベントです。",
      "An annual event where Japanese and international high school students in Yokosuka share speeches and skits on a chosen theme, followed by a social gathering. A great opportunity to build cross-cultural understanding.",
      p.description,
    );
    console.log("  Description: rewritten (broke up run-on, removed redundancy)");

    if (!DRY_RUN) tx.patch(p._id, { set: { description: newDesc } });
  }

  // ── nihongo-handbook (minor) ────────────────────────────────

  // Looks good as-is, skipping.

  // ── Commit ──────────────────────────────────────────────────

  if (DRY_RUN) {
    console.log("\n[DRY RUN] No changes written.\n");
    return;
  }

  const result = await tx.commit();
  console.log(`\nAll fixes applied. Transaction ID: ${result.transactionId}\n`);
}

fixAll().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
