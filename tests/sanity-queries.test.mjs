import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { parse, evaluate } from "groq-js";
import ts from "typescript";
import * as revalidation from "../lib/sanity/revalidation.ts";

function queries(dataset) {
  const calls = [];
  const exports = {};
  const source = readFileSync(new URL("../lib/sanity/queries.ts", import.meta.url), "utf8");
  runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      exports,
      performance,
      console: { log() {} },
      require(name) {
        if (name === "react") return { cache: (fn) => fn };
        if (name === "./revalidation") return revalidation;
        if (name === "./client")
          return {
            client: {
              async fetch(query, params, options) {
                calls.push({ query, params, tags: options.next.tags });
                return (await evaluate(parse(query), { dataset, params })).get();
              },
            },
          };
        throw new Error(name);
      },
    },
  );
  return { api: exports, calls };
}

const page = {
  _id: "page-legacy-forum",
  _type: "page",
  slug: "youth-forum",
  title: [{ _key: "ja", value: "Forum" }],
  description: [],
  images: [],
  sections: [{ _key: "section-anchor", _type: "text", body: "Complete body" }],
};

test("page queries preserve slug and legacy ID resolution, with full section keys", async () => {
  const { api } = queries([page]);
  for (const slug of ["youth-forum", "legacy-forum"]) {
    assert.deepEqual(await api.fetchPageBySlug(slug), page);
  }
  assert.equal(await api.fetchPageBySlug("missing"), null);
  const summary = await api.fetchPageSummary("youth-forum");
  assert.equal(summary.title[0].value, "Forum");
  assert.ok(!Object.hasOwn(summary, "sections"));
});

test("navigation projects only referenced card fields, never page bodies", async () => {
  const { api } = queries([
    page,
    {
      _id: "nav",
      _type: "navigation",
      categories: [{ items: [{ pageRef: { _ref: page._id } }] }],
    },
  ]);
  const nav = await api.fetchNavigation();
  assert.deepEqual(nav.categories[0].items[0].pageRef, {
    _id: page._id,
    slug: page.slug,
    title: page.title,
  });
});

test("homepage links preserve pinned/date ordering with missing pinned fields", async () => {
  const docs = [
    { _id: "old", _type: "announcement", pinned: false, date: "2020-01-01" },
    { _id: "new", _type: "announcement", date: "2026-09-10" },
    { _id: "pinned", _type: "announcement", pinned: true, date: "2019-01-01" },
  ];
  const { api } = queries(docs);
  assert.deepEqual(
    (await api.fetchHomepageAnnouncements()).map((doc) => doc._id),
    ["pinned", "new", "old"],
  );
});

test("deleted related blog references are omitted and cards never fetch other bodies", async () => {
  const post = {
    _id: "a",
    _type: "blogPost",
    slug: { current: "a" },
    relatedPosts: [{ _ref: "deleted" }, { _ref: "b" }],
  };
  const related = {
    _id: "b",
    _type: "blogPost",
    slug: { current: "b" },
    title: [],
    body: "large body",
  };
  const { api } = queries([post, related]);
  const result = await api.fetchBlogPostBySlug("a");
  assert.equal(result.relatedPosts.length, 1);
  assert.equal(result.relatedPosts[0].slug, "b");
  assert.ok(!Object.hasOwn(result.relatedPosts[0], "body"));
});

test("a body publish intersects only its own detail fetch among actual route dependencies", async () => {
  const { api, calls } = queries([page]);
  await api.fetchPageBySlug(page.slug);
  await api.fetchPageBySlug("another-page");
  await api.fetchPageSummary(page.slug);
  await api.fetchNavigation();
  await api.fetchSiteSettings();
  await api.fetchSidebar();
  await api.fetchHomepage();
  await api.fetchHomepageAnnouncements();
  await api.fetchSocialImageData();
  await api.fetchBlogPostCount();
  const plan = revalidation.resolveSanityRevalidationPlan({
    schemaVersion: 1,
    before: page,
    after: { ...page, sections: ["new"] },
  });
  assert.deepEqual(
    calls
      .filter((call) => call.tags.some((tag) => plan.tags.includes(tag)))
      .map((call) => call.params.slug),
    [page.slug],
  );
});
