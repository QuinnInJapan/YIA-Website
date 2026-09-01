import test from "node:test";
import assert from "node:assert/strict";
import {
  recommendedSlugFromEnglishTitle,
  recommendedSlugDefault,
  studioSlugError,
  studioSlugValue,
} from "../lib/studio-slug.ts";

test("recommendedSlugFromEnglishTitle creates a readable ASCII slug", () => {
  assert.equal(
    recommendedSlugFromEnglishTitle("YIA’s Café & Summer Exchange 2026!"),
    "yias-cafe-and-summer-exchange-2026",
  );
});

test("recommendedSlugFromEnglishTitle trims without leaving a trailing hyphen", () => {
  assert.equal(recommendedSlugFromEnglishTitle("A very long English title", 12), "a-very-long");
});

test("recommendedSlugDefault fills only an empty slug", () => {
  assert.equal(recommendedSlugDefault(null, "Summer Exchange 2026"), "summer-exchange-2026");
  assert.equal(
    recommendedSlugDefault({ current: "staff-selected-url" }, "Summer Exchange 2026"),
    null,
  );
});

test("studioSlugError accepts route-safe slugs", () => {
  assert.equal(studioSlugError({ current: "summer-event-2026" }), null);
});

test("studioSlugError rejects full URLs and malformed slugs", () => {
  assert.match(studioSlugError("https://yia.jp/blog/example"), /URL全体/);
  assert.match(studioSlugError("Summer Event"), /半角小文字/);
  assert.match(studioSlugError("summer--event"), /半角小文字/);
});

test("studioSlugValue reads strings and Sanity slug values", () => {
  assert.equal(studioSlugValue("  summer-event  "), "summer-event");
  assert.equal(studioSlugValue({ current: "  blog-post  " }), "blog-post");
});
