import assert from "node:assert/strict";
import test from "node:test";

import {
  announcementPath,
  selectHomepageAnnouncements,
} from "../components/templates/homepage-announcements.ts";

const title = (value) => [{ _key: "ja", value }];

test("uses pinned/latest announcements even when legacy curated refs exist", () => {
  const curatedFirst = {
    _id: "announcement-website-renewal-2026",
    date: "2026-03-11",
    title: title("ホームページをリニューアルしました"),
  };
  const curatedSecond = {
    _id: "announcement-patchwork-sale",
    date: "2026-02-15",
    title: title("和雑貨・キルト作品 販売中"),
  };

  const selected = selectHomepageAnnouncements({
    homepage: {
      announcementRefs: [curatedFirst, curatedSecond],
    },
    announcements: [
      {
        _id: "announcement-counseling-schedule-change",
        date: "2026-02-28",
        pinned: true,
        title: title("多言語相談 時間変更"),
      },
      curatedSecond,
      curatedFirst,
    ],
  });

  assert.deepEqual(
    selected.map((announcement) => announcement._id),
    [
      "announcement-counseling-schedule-change",
      "announcement-website-renewal-2026",
      "announcement-patchwork-sale",
    ],
  );
});

test("falls back to pinned/latest announcements when no curated refs exist", () => {
  const selected = selectHomepageAnnouncements({
    homepage: { announcementRefs: [] },
    announcements: [
      { _id: "older", date: "2026-01-01", title: title("Older") },
      { _id: "pinned", date: "2025-01-01", pinned: true, title: title("Pinned") },
      { _id: "newer", date: "2026-02-01", title: title("Newer") },
    ],
  });

  assert.deepEqual(
    selected.map((announcement) => announcement._id),
    ["pinned", "newer", "older"],
  );
});

test("builds homepage announcement links from string slugs", () => {
  assert.equal(
    announcementPath({
      _id: "announcement-website-renewal-2026",
      slug: "our-website-has-been-redesigned",
    }),
    "/announcements/our-website-has-been-redesigned",
  );
});

test("builds homepage announcement links from Sanity slug objects", () => {
  assert.equal(
    announcementPath({
      _id: "announcement-website-renewal-2026",
      slug: { current: "our-website-has-been-redesigned" },
    }),
    "/announcements/our-website-has-been-redesigned",
  );
});

test("falls back to announcement id when slug is missing", () => {
  assert.equal(
    announcementPath({
      _id: "announcement-website-renewal-2026",
    }),
    "/announcements/announcement-website-renewal-2026",
  );
});

test("links an internal-page announcement directly to its selected site page", () => {
  assert.equal(
    announcementPath({
      _id: "internal-link-announcement",
      destinationType: "internalPage",
      targetPageData: {
        slug: "foreign-language",
        categoryId: "category-classes",
      },
    }),
    "/classes/foreign-language",
  );
});

test("can link an internal-page announcement to a selected table-of-contents entry", () => {
  assert.equal(
    announcementPath({
      _id: "internal-link-announcement",
      destinationType: "internalPage",
      targetPageData: {
        slug: "foreign-language",
        categoryId: "category-classes",
      },
      targetAnchor: "sec-申込み方法",
    }),
    "/classes/foreign-language#sec-%E7%94%B3%E8%BE%BC%E3%81%BF%E6%96%B9%E6%B3%95",
  );
});
