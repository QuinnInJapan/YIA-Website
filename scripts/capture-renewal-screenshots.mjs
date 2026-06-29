#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const OUTPUT_DIR = "/private/tmp/yia-renewal-screenshots";

const SHOTS = [
  {
    key: "home-old",
    url: "http://yia.jp/index.htm",
    title: "旧サイト トップページ",
  },
  {
    key: "home-new",
    url: "https://yia-nextjs.vercel.app/",
    title: "新サイト トップページ",
  },
  {
    key: "conversation-old",
    url: "http://yia.jp/top/09katsudo/shien/kaiwasalon/kaiwasalon-top/kaiwasalon-top.html",
    title: "旧サイト 日本語会話サロン",
  },
  {
    key: "conversation-new",
    url: "https://yia-nextjs.vercel.app/classes/conversation-salon",
    title: "新サイト 日本語会話サロン",
  },
  {
    key: "sister-old",
    url: "http://yia.jp/top/09katsudo/sistercity/sistercity-top/sistercity-top.htm",
    title: "旧サイト 姉妹都市交換学生",
  },
  {
    key: "sister-new",
    url: "https://yia-nextjs.vercel.app/partnerships/sister-city",
    title: "新サイト 姉妹都市交換学生",
  },
  {
    key: "about-old",
    url: "http://yia.jp/top/09aboutyia/aboutyia-top.htm",
    title: "旧サイト YIAについて",
  },
  {
    key: "about-new",
    url: "https://yia-nextjs.vercel.app/about/about",
    title: "新サイト YIAについて",
  },
];

await fs.mkdir(OUTPUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
});

page.setDefaultTimeout(45_000);

const manifest = [];

for (const shot of SHOTS) {
  const filePath = path.join(OUTPUT_DIR, `${shot.key}.png`);
  console.log(`Capturing ${shot.key}: ${shot.url}`);
  await page.goto(shot.url, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await page.screenshot({ path: filePath, fullPage: false });
  manifest.push({ ...shot, filePath });
}

await browser.close();

const manifestPath = path.join(OUTPUT_DIR, "manifest.json");
await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${manifestPath}`);
