import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolveSanityRevalidationPlan as plan,
  sanityTags as t,
  sanityDocumentTag as key,
  SANITY_SITE_DATA_TAG,
} from "../lib/sanity/revalidation.ts";

const page = {
  _type: "page",
  _id: "page-forum",
  slug: "youth-forum",
  title: [{ _key: "ja", value: "Forum" }],
  categoryRef: { _ref: "category-events" },
};
const event = (before, after) => ({ schemaVersion: 1, before, after });
const update = (doc, patch) => plan(event(doc, { ...doc, ...patch }));
const has = (result, ...tags) => tags.forEach((tag) => assert.ok(result.tags.includes(tag), tag));
const excludes = (result, ...tags) =>
  tags.forEach((tag) => assert.ok(!result.tags.includes(tag), tag));

test("page body edits only expire the changed page, including its legacy ID lookup", () => {
  const result = update(page, { sections: [{ _key: "preserved", body: "new" }] });
  assert.deepEqual(
    new Set(result.tags),
    new Set([key("page", "youth-forum"), key("page", "page-forum"), key("page", "forum")]),
  );
  assert.deepEqual(result.paths, []);
});

test("page summaries refresh for description/images without touching global navigation", () => {
  for (const patch of [{ description: [] }, { images: [{ file: { _ref: "image-new" } }] }]) {
    const result = update(page, patch);
    has(result, key("page-summary", "youth-forum"));
    excludes(result, t.navigation, t.navigationRoutes, t.social, t.announcements);
  }
});

test("titles update navigation while slugs invalidate old/new lookups and incoming links", () => {
  const title = update(page, { title: [{ _key: "ja", value: "New name" }] });
  has(title, t.navigation, key("page-summary", "youth-forum"));
  excludes(title, t.navigationRoutes, t.announcementTargets, t.social);
  const rename = update(page, { slug: "new-forum" });
  has(
    rename,
    key("page", "youth-forum"),
    key("page", "new-forum"),
    key("page-summary", "youth-forum"),
    key("page-summary", "new-forum"),
    t.navigation,
    t.navigationRoutes,
    t.announcementTargets,
  );
  has(update(page, { categoryRef: { _ref: "category-support" } }), t.announcementTargets);
});

test("publishing and deleting pages refresh null references, old lookups and routes", () => {
  for (const payload of [event(null, page), event(page, null)]) {
    has(
      plan(payload),
      key("page", "youth-forum"),
      t.navigation,
      t.navigationRoutes,
      key("page-summary", "youth-forum"),
      t.announcementTargets,
    );
  }
});

test("blog body edits leave blog presence and cross-post cards cached", () => {
  const blog = { _type: "blogPost", _id: "post-1", slug: { current: "one" } };
  const body = update(blog, { body: "new" });
  has(body, key("blog", "one"), t.blogList, t.blogRoutes);
  excludes(body, t.blogCount, t.blogAdjacent, t.blogRelated, t.navigation, t.social);
  has(update(blog, { title: ["new"] }), t.blogAdjacent, t.blogRelated);
  has(update(blog, { heroImage: { _ref: "new" } }), t.blogRelated);
  for (const payload of [event(null, blog), event(blog, null)]) {
    has(plan(payload), t.blogCount, t.blogRelated, t.blogAdjacent, key("blog", "one"));
  }
  has(update(blog, { slug: { current: "two" } }), key("blog", "one"), key("blog", "two"));
});

test("announcements refresh homepage/list entries and their own detail only", () => {
  const doc = { _type: "announcement", _id: "notice-1", slug: { current: "notice" } };
  const result = update(doc, { body: "new" });
  has(result, t.announcements, key("announcement", "notice"), key("announcement", "notice-1"));
  excludes(
    result,
    t.announcementCount,
    t.announcementDocuments,
    t.settings,
    t.navigation,
    t.social,
    t.blogCount,
  );
  has(plan(event(doc, null)), t.announcementCount);
});

test("social image only expires when its actual inputs change", () => {
  const homepage = {
    _type: "homepage",
    _id: "homepage",
    hero: { image: { _ref: "a" }, tagline: [] },
  };
  excludes(update(homepage, { hero: { ...homepage.hero, tagline: ["changed"] } }), t.social);
  has(update(homepage, { hero: { ...homepage.hero, image: { _ref: "b" } } }), t.social);
  const settings = {
    _type: "siteSettings",
    _id: "settings",
    org: { name: [], abbreviation: "YIA" },
  };
  excludes(update(settings, { contact: { tel: "new" } }), t.social);
  has(update(settings, { org: { ...settings.org, abbreviation: "New" } }), t.social);
  excludes(update(homepage, { hero: { tagline: [], image: { _ref: "a" } } }), t.social);
});

test("category and singleton dependencies remain current", () => {
  has(
    plan({ _type: "category" }),
    t.navigation,
    t.featured,
    t.categories,
    t.navigationRoutes,
    t.announcementTargets,
  );
  assert.deepEqual(plan({ _type: "sidebar" }).tags, [t.sidebar]);
  assert.deepEqual(plan({ _type: "homepageAbout" }).tags, [t.homepageAbout]);
  assert.deepEqual(plan({ _type: "homepageFeatured" }).tags, [t.featured]);
});

test("legacy hooks safely invalidate type caches, including unknown old slugs", () => {
  has(plan({ document: page }), t.pages, t.pageSummaries, t.navigation, t.announcementTargets);
  has(plan({ _type: "blogPost" }), t.blogDocuments, t.blogRelated, t.blogCount);
  has(plan({ _type: "announcement" }), t.announcementDocuments, t.announcements);
  excludes(plan(page), SANITY_SITE_DATA_TAG, t.social, t.settings);
});

test("drafts, versions, assets and malformed payloads cannot purge the site", () => {
  for (const payload of [
    null,
    {},
    { paths: ["https://example.com", "../bad", "//bad"] },
    { _type: "sanity.imageAsset" },
    { ...page, _id: "drafts.page-forum" },
    { ...page, _id: "versions.release.page-forum" },
    event(null, { ...page, _id: "drafts.page-forum" }),
    event(null, null),
  ])
    assert.deepEqual(plan(payload), { tags: [], paths: [] });
});

test("explicit maintenance paths preserve the authenticated full purge", () => {
  assert.deepEqual(plan({ paths: ["/", "/events/", "https://bad", "../bad"] }), {
    tags: [SANITY_SITE_DATA_TAG],
    paths: [
      { path: "/", type: "page" },
      { path: "/events", type: "page" },
    ],
  });
});
