import assert from "node:assert/strict";
import test from "node:test";

import { SITE_NAME, SITE_URL, socialMetadata, pageMetadata, contentDescription } from "../lib/site-metadata.ts";

test("builds complete rich-link metadata for a public page", () => {
  const metadata = socialMetadata({
    title: "横須賀国際交流協会について",
    description: "協会の活動と概要をご紹介します。",
    pathname: "/about/about",
  });

  assert.deepEqual(metadata.alternates, { canonical: "/about/about" });
  assert.equal(metadata.openGraph?.siteName, SITE_NAME);
  assert.equal(metadata.openGraph?.url, "/about/about");
  assert.equal(metadata.openGraph?.locale, "ja_JP");
  assert.equal(metadata.twitter?.card, "summary_large_image");
  assert.equal(metadata.openGraph?.images?.[0]?.alt, "横須賀国際交流協会の活動風景と団体名");
  assert.equal(metadata.twitter?.images?.[0]?.alt, "横須賀国際交流協会の活動風景と団体名");
});

test("uses yia.jp as the only canonical site origin", () => {
  assert.equal(SITE_URL, "https://yia.jp");
});

test("search overrides leave supplied page content intact and share consistent metadata", () => {
  const input = { title: "日本語会話サロン", description: "教室の案内", pathname: "/classes/conversation-salon" };
  const metadata = pageMetadata(input);
  assert.equal(input.title, "日本語会話サロン");
  assert.match(metadata.title, /横須賀の日本語教室/);
  assert.equal(metadata.description, input.description);
  assert.equal(metadata.openGraph.description, metadata.description);
  assert.equal(metadata.twitter.title, metadata.openGraph.title);
  assert.equal(metadata.alternates.canonical, input.pathname);
  assert.equal(pageMetadata({ ...input, pathname: "/classes/new-course" }).title, input.title);
});

test("announcement descriptions prefer Japanese summaries and support legacy content", () => {
  const bilingual = [
    { _key: "en", value: "English only title" },
    { _key: "ja", value: [{ _type: "image" }, { _type: "block", children: [{ text: "日本語の" }, { text: "開催案内。\n  申込受付中。" }] }] },
  ];
  assert.equal(contentDescription(undefined, bilingual), "日本語の開催案内。 申込受付中。");
  assert.equal(contentDescription([{ _key: "ja", value: "概要" }], bilingual), "概要");
  assert.equal(contentDescription([{ _key: "en", value: "English only" }]), undefined);
  assert.equal(contentDescription(null, "旧形式の本文"), "旧形式の本文");
  assert.equal(contentDescription([{ _type: "image", alt: "画像" }]), undefined);
  assert.equal(contentDescription("\u200B \n", "代替の本文"), "代替の本文");
  assert.equal([...contentDescription("😀".repeat(200))].length, 160);
});
