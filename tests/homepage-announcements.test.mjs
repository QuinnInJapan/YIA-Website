import assert from "node:assert/strict";
import test from "node:test";

import { selectHomepageAnnouncements } from "../components/templates/homepage-announcements.ts";

const title = (value) => [{ _key: "ja", value }];

test("uses curated homepage announcement refs before global latest announcements", () => {
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
    ["announcement-website-renewal-2026", "announcement-patchwork-sale"],
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
