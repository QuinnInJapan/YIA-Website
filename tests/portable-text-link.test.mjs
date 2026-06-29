import assert from "node:assert/strict";
import test from "node:test";

import { normalizePortableTextHrefInput, safePortableTextHref } from "../lib/portable-text-link.ts";

test("safePortableTextHref allows safe public and local link targets", () => {
  assert.equal(safePortableTextHref("https://example.com"), "https://example.com");
  assert.equal(safePortableTextHref("http://example.com"), "http://example.com");
  assert.equal(safePortableTextHref("/about/about"), "/about/about");
  assert.equal(safePortableTextHref("#section"), "#section");
  assert.equal(safePortableTextHref("mailto:info@example.com"), "mailto:info@example.com");
  assert.equal(safePortableTextHref("tel:0468272166"), "tel:0468272166");
});

test("safePortableTextHref rejects unsafe or malformed link targets", () => {
  assert.equal(safePortableTextHref("javascript:alert(1)"), undefined);
  assert.equal(safePortableTextHref("//example.com"), undefined);
  assert.equal(safePortableTextHref("example.com"), undefined);
  assert.equal(safePortableTextHref(""), undefined);
  assert.equal(safePortableTextHref(null), undefined);
});

test("normalizePortableTextHrefInput adds https to bare domains", () => {
  assert.equal(normalizePortableTextHrefInput("example.com/path"), "https://example.com/path");
  assert.equal(
    normalizePortableTextHrefInput("https://example.com/path"),
    "https://example.com/path",
  );
  assert.equal(normalizePortableTextHrefInput("javascript:alert(1)"), undefined);
});
