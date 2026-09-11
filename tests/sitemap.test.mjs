import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { parse, evaluate } from "groq-js";
import ts from "typescript";
import * as revalidation from "../lib/sanity/revalidation.ts";
import * as routes from "../lib/routes.ts";
import * as navigation from "../lib/sanity/navigation-routes.ts";
import * as metadata from "../lib/site-metadata.ts";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const updatedAt = "2026-09-11T01:00:00Z";
const nav = { categories: [{ categoryRef: { _id: "category-classes" }, items: [
  { pageRef: { slug: "salon" } }, { pageRef: { slug: "salon" } },
] }] };

async function sitemap(dataset) {
  const exports = {};
  const calls = [];
  const client = { async fetch(query, params, options) {
    calls.push({ query, options });
    return (await evaluate(parse(query), { dataset, params })).get();
  } };
  runInNewContext(ts.transpileModule(read("../app/sitemap.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports,
    require(name) {
      if (name === "@/lib/routes") return routes;
      if (name === "@/lib/site-metadata") return metadata;
      if (name === "@/lib/sanity/client") return { client };
      if (name === "@/lib/sanity/revalidation") return revalidation;
      if (name === "@/lib/sanity/navigation-routes") return {
        ...navigation, fetchNavigationRouteDocument: async () => nav,
      };
      throw new Error("Unexpected dependency: " + name);
    },
  });
  return { entries: JSON.parse(JSON.stringify(await exports.default())), calls };
}

test("sitemap includes canonical published details, dates, and ID fallback without duplicates", async () => {
  const detail = { _type: "announcement", _id: "notice-id", slug: { current: "notice" }, _updatedAt: updatedAt };
  const { entries } = await sitemap([
    detail,
    { ...detail, _id: "drafts.notice-id" },
    { ...detail, _id: "versions.release.notice-id", slug: { current: "future-notice" } },
    { ...detail, _id: "old-notice", slug: null },
    { ...detail, _id: "internal", slug: { current: "internal" }, destinationType: "internalPage" },
    { _type: "page", _id: "page-salon", slug: "salon", _updatedAt: updatedAt },
    { _type: "page", _id: "drafts.page-salon", slug: "salon", _updatedAt: "2099-01-01T00:00:00Z" },
    { _type: "blogPost", _id: "post", slug: { current: "post" }, _updatedAt: updatedAt },
    { _type: "blogPost", _id: "drafts.post", slug: { current: "draft" } },
    { _type: "blogPost", _id: "empty", slug: { current: "" } },
  ]);
  const byUrl = new Map(entries.map((entry) => [entry.url, entry]));
  assert.equal(entries.length, byUrl.size);
  assert.equal(byUrl.get("https://yia.jp/announcements/notice").lastModified, updatedAt);
  assert.equal(byUrl.get("https://yia.jp/classes/salon").lastModified, updatedAt);
  assert.equal(byUrl.get("https://yia.jp/blog/post").lastModified, updatedAt);
  assert.ok(byUrl.has("https://yia.jp/announcements/old-notice"));
  assert.ok(byUrl.has("https://yia.jp/blog"));
  for (const suffix of ["notice-id", "internal", "future-notice"]) {
    assert.ok(!byUrl.has(`https://yia.jp/announcements/${suffix}`));
  }
  assert.ok(!byUrl.has("https://yia.jp/blog/draft"));
  assert.ok(!byUrl.has("https://yia.jp/blog/"));
});

test("sitemap date and announcement queries are invalidated by each published lifecycle event", async () => {
  const { calls, entries } = await sitemap([]);
  assert.ok(!entries.some((entry) => entry.url === "https://yia.jp/blog"));
  for (const type of ["page", "announcement", "blogPost"]) {
    const doc = { _type: type, _id: "doc", slug: "slug" };
    const query = calls.find((call) => call.query.includes(`_type == "${type}"`));
    assert.equal(query.options.next.revalidate, false);
    for (const [before, after] of [[null, doc], [doc, { ...doc, body: "changed" }], [doc, { ...doc, slug: "renamed", destinationType: "internalPage" }], [doc, null]]) {
      const plan = revalidation.resolveSanityRevalidationPlan({ schemaVersion: 1, before, after });
      assert.ok(query.options.next.tags.some((tag) => plan.tags.includes(tag)), type);
      assert.ok(!plan.tags.includes(revalidation.SANITY_SITE_DATA_TAG));
      assert.deepEqual(plan.paths, []);
    }
  }
});

test("robots advertises the same canonical origin as the sitemap", () => {
  assert.match(read("../public/robots.txt"), new RegExp(`Sitemap: ${metadata.SITE_URL.replaceAll(".", "\\.")}/sitemap\\.xml`));
});
