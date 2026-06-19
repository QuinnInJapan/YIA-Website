import assert from "node:assert/strict";
import test from "node:test";

import { resolveHomepageAboutContent } from "../components/templates/homepage-about-content.ts";

test("uses default headings when homepageAbout has not been published", () => {
  const content = resolveHomepageAboutContent(null);

  assert.equal(content.titleJa, "YIAについて");
  assert.equal(content.titleEn, "About YIA");
});

test("uses default headings when the published homepageAbout document is missing title fields", () => {
  const content = resolveHomepageAboutContent({
    bodyJa: "公開済みの日本語本文",
    bodyEn: "Published English body",
  });

  assert.equal(content.titleJa, "YIAについて");
  assert.equal(content.titleEn, "About YIA");
  assert.equal(content.bodyJa, "公開済みの日本語本文");
  assert.equal(content.bodyEn, "Published English body");
});
