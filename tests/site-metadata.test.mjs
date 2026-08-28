import assert from "node:assert/strict";
import test from "node:test";

import { SITE_NAME, SITE_URL, socialMetadata } from "../lib/site-metadata.ts";

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
