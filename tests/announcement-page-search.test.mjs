import assert from "node:assert/strict";
import test from "node:test";

import {
  filterInternalPages,
  matchingInternalPageHeading,
  searchableInternalPagePath,
} from "../lib/announcement-page-search.ts";

const i18n = (ja, en = "") => [
  { _key: "ja", value: ja },
  { _key: "en", value: en },
];

const pages = [
  {
    _id: "page-foreign-languages",
    title: i18n("外国語講座", "Foreign language classes"),
    slug: "foreign-languages",
    categoryId: "category-classes",
    categoryTitle: i18n("教室・講座", "Learning"),
    sections: [{ title: i18n("申込み方法", "How to apply") }],
  },
  {
    _id: "page-counseling",
    title: i18n("多言語相談", "Multilingual counseling"),
    slug: "counseling",
    categoryId: "category-consultation",
    categoryTitle: i18n("相談・サービス", "Consultation & Services"),
    sections: [{ title: i18n("相談時間", "Hours") }],
  },
];

test("searches internal pages by title, category, path, and table-of-contents heading", () => {
  assert.deepEqual(
    filterInternalPages(pages, "外国語").map((page) => page._id),
    ["page-foreign-languages"],
  );
  assert.deepEqual(
    filterInternalPages(pages, "Learning").map((page) => page._id),
    ["page-foreign-languages"],
  );
  assert.deepEqual(
    filterInternalPages(pages, "classes foreign").map((page) => page._id),
    ["page-foreign-languages"],
  );
  assert.deepEqual(
    filterInternalPages(pages, "申込み方法").map((page) => page._id),
    ["page-foreign-languages"],
  );
});

test("normalizes full-width search input and builds the public page path", () => {
  assert.deepEqual(
    filterInternalPages(pages, "ＦＯＲＥＩＧＮ").map((page) => page._id),
    ["page-foreign-languages"],
  );
  assert.equal(searchableInternalPagePath(pages[0]), "/classes/foreign-languages");
});

test("ranks title matches above heading matches and explains heading matches", () => {
  const rankedPages = [
    {
      _id: "page-heading-match",
      title: i18n("講座一覧"),
      slug: "classes",
      categoryId: "category-classes",
      categoryTitle: i18n("教室・講座"),
      sections: [{ title: i18n("申込み") }],
    },
    {
      _id: "page-title-match",
      title: i18n("申込み案内"),
      slug: "application",
      categoryId: "category-guide",
      categoryTitle: i18n("利用案内"),
      sections: [],
    },
  ];

  assert.deepEqual(
    filterInternalPages(rankedPages, "申込み").map((page) => page._id),
    ["page-title-match", "page-heading-match"],
  );
  assert.equal(matchingInternalPageHeading(rankedPages[0], "申込み"), "申込み");
  assert.equal(matchingInternalPageHeading(rankedPages[1], "申込み"), "");
});
