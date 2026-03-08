/**
 * Seed: Create a demo blog post in Sanity
 *
 * Creates a sample blogPost document to demonstrate the blog feature.
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/seed-demo-blog-post.mjs
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

// Reuse existing high-res images from Sanity
const HERO_IMAGE_REF = "image-e54900219fc220f825fd41d4bd11d7a3f38aaafe-1600x1205-jpg"; // InternationalYouthForum
const INLINE_IMAGE_REF = "image-99d9ad2aed050bd45e98411069d07a711ff3f76d-1600x1200-jpg"; // 2024.11 event photo
const GALLERY_REFS = [
  "image-109a0d6e0d5951be874c6981cebf545ead113a09-1600x1200-jpg", // 2024 jfy
  "image-87bf1b370a052d0d400f02e9e731be7a78580e80-1024x768-jpg", // Youth Forum 1
  "image-d1215461d9c0380c192108fd93f747aa08a3905a-800x450-jpg", // Fremantle
  "image-2c4d3a7c54dd566b5db104c38f639a93044bc4bc-800x533-jpg", // Rochester Castle
];

function imageRef(id) {
  return { _type: "image", asset: { _type: "reference", _ref: id } };
}

const demoBlogPost = {
  _id: "blogpost-demo-sakura-matsuri-2025",
  _type: "blogPost",
  title: [
    { _key: "ja", value: "桜まつり2025：国際交流のひととき" },
    { _key: "en", value: "Sakura Matsuri 2025: A Moment of International Exchange" },
  ],
  slug: { _type: "slug", current: "sakura-matsuri-2025" },
  author: "横須賀国際交流協会",
  publishedAt: "2025-03-15T09:00:00Z",
  category: "event-report",
  heroImage: {
    ...imageRef(HERO_IMAGE_REF),
    alt: [
      { _key: "ja", value: "国際交流フォーラムの参加者たち" },
      { _key: "en", value: "Participants at the International Exchange Forum" },
    ],
  },
  excerpt: [
    {
      _key: "ja",
      value:
        "2025年春、横須賀市で開催された桜まつりの様子をレポートします。多くの外国人住民と地域の方々が交流を楽しみました。",
    },
    {
      _key: "en",
      value:
        "A report on the 2025 Sakura Matsuri held in Yokosuka. Many foreign residents and local community members enjoyed cultural exchange.",
    },
  ],
  body: [
    {
      _key: "ja",
      value: [
        {
          _key: "intro",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "t1",
              _type: "span",
              text: "2025年3月15日、横須賀市の公園で毎年恒例の桜まつりが開催されました。今年は約500名の参加者が集まり、日本文化と国際交流を楽しむ一日となりました。",
            },
          ],
          markDefs: [],
        },
        {
          _key: "h2-highlights",
          _type: "block",
          style: "h2",
          children: [
            { _key: "t2", _type: "span", text: "イベントのハイライト" },
          ],
          markDefs: [],
        },
        {
          _key: "p-highlights",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "t3",
              _type: "span",
              text: "今年の桜まつりでは、茶道体験、書道ワークショップ、折り紙教室など、さまざまな日本文化体験コーナーが設けられました。参加者の皆さんは初めての体験に目を輝かせていました。",
            },
          ],
          markDefs: [],
        },
        // Inline image after highlights
        {
          _key: "inline-img-1",
          _type: "image",
          asset: { _type: "reference", _ref: INLINE_IMAGE_REF },
          alt: "イベント会場の様子",
        },
        {
          _key: "callout-1",
          _type: "callout",
          tone: "tip",
          body: "次回のイベントは5月のこどもの日フェスティバルです。詳細は追ってお知らせします！",
        },
        {
          _key: "h2-voices",
          _type: "block",
          style: "h2",
          children: [
            { _key: "t4", _type: "span", text: "参加者の声" },
          ],
          markDefs: [],
        },
        {
          _key: "p-voice1",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "t5",
              _type: "span",
              text: "「初めて茶道を体験しました。とても美しい文化ですね」（アメリカ出身・30代）",
            },
          ],
          markDefs: [],
        },
        {
          _key: "p-voice2",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "t6",
              _type: "span",
              text: "「地域の方々と交流できて、横須賀がもっと好きになりました」（フィリピン出身・20代）",
            },
          ],
          markDefs: [],
        },
        // Inline gallery after participant voices
        {
          _key: "gallery-1",
          _type: "inlineGallery",
          images: GALLERY_REFS.map((ref, i) => ({
            _key: `gimg-${i}`,
            _type: "imageFile",
            file: { _type: "image", asset: { _type: "reference", _ref: ref } },
            caption: [
              { _key: "ja", value: ["交流フォーラム", "ユースフォーラム", "フリマントル市", "ロチェスター城"][i] },
              { _key: "en", value: ["Exchange Forum", "Youth Forum", "Fremantle", "Rochester Castle"][i] },
            ],
          })),
        },
        {
          _key: "h2-next",
          _type: "block",
          style: "h2",
          children: [
            { _key: "t7", _type: "span", text: "今後の活動" },
          ],
          markDefs: [],
        },
        {
          _key: "p-next",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "t8",
              _type: "span",
              text: "横須賀国際交流協会では、今後も季節ごとのイベントを企画しています。外国人住民の方も、地域の方も、ぜひお気軽にご参加ください。",
            },
          ],
          markDefs: [],
        },
      ],
    },
    {
      _key: "en",
      value: [
        {
          _key: "en-intro",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "et1",
              _type: "span",
              text: "On March 15, 2025, the annual Sakura Matsuri was held at a park in Yokosuka City. This year, approximately 500 participants gathered for a day of Japanese culture and international exchange.",
            },
          ],
          markDefs: [],
        },
        {
          _key: "en-h2",
          _type: "block",
          style: "h2",
          children: [
            { _key: "et2", _type: "span", text: "Event Highlights" },
          ],
          markDefs: [],
        },
        {
          _key: "en-p-highlights",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "et3",
              _type: "span",
              text: "This year's festival featured tea ceremony experiences, calligraphy workshops, and origami classes. Participants were delighted by these first-time cultural experiences.",
            },
          ],
          markDefs: [],
        },
        // Inline image in English body too
        {
          _key: "en-inline-img-1",
          _type: "image",
          asset: { _type: "reference", _ref: INLINE_IMAGE_REF },
          alt: "Event venue atmosphere",
        },
        {
          _key: "en-callout-1",
          _type: "callout",
          tone: "tip",
          body: "The next event is the Children's Day Festival in May. Stay tuned for details!",
        },
        {
          _key: "en-h2-voices",
          _type: "block",
          style: "h2",
          children: [
            { _key: "et4", _type: "span", text: "Participant Voices" },
          ],
          markDefs: [],
        },
        {
          _key: "en-p-voice1",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "et5",
              _type: "span",
              text: '"I experienced a tea ceremony for the first time. What a beautiful culture!" (From the US, 30s)',
            },
          ],
          markDefs: [],
        },
        {
          _key: "en-p-voice2",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "et6",
              _type: "span",
              text: '"I was able to connect with local people and now I love Yokosuka even more." (From the Philippines, 20s)',
            },
          ],
          markDefs: [],
        },
        // Gallery in English body
        {
          _key: "en-gallery-1",
          _type: "inlineGallery",
          images: GALLERY_REFS.map((ref, i) => ({
            _key: `en-gimg-${i}`,
            _type: "imageFile",
            file: { _type: "image", asset: { _type: "reference", _ref: ref } },
            caption: [
              { _key: "ja", value: ["交流フォーラム", "ユースフォーラム", "フリマントル市", "ロチェスター城"][i] },
              { _key: "en", value: ["Exchange Forum", "Youth Forum", "Fremantle", "Rochester Castle"][i] },
            ],
          })),
        },
        {
          _key: "en-h2-next",
          _type: "block",
          style: "h2",
          children: [
            { _key: "et7", _type: "span", text: "Upcoming Activities" },
          ],
          markDefs: [],
        },
        {
          _key: "en-p-next",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "et8",
              _type: "span",
              text: "YIA continues to plan seasonal events throughout the year. Both foreign residents and local community members are warmly welcome to participate.",
            },
          ],
          markDefs: [],
        },
      ],
    },
  ],
};

async function seed() {
  console.log(DRY_RUN ? "\n[DRY RUN MODE]\n" : "\n[LIVE MODE]\n");

  console.log("Blog post to create:");
  console.log(JSON.stringify(demoBlogPost, null, 2));

  if (DRY_RUN) {
    console.log("\n✅ Dry run complete. Run without --dry-run to create the document.");
    return;
  }

  const result = await client.createOrReplace(demoBlogPost);
  console.log(`\n✅ Created blog post: ${result._id}`);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
