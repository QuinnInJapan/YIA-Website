import assert from "node:assert/strict";
import test from "node:test";

import {
  ANNOUNCEMENT_DESTINATION_DETAIL,
  ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE,
  announcementDestination,
  announcementSlugError,
} from "../lib/announcement-fields.ts";

test("treats existing announcements without a destination as detail-page announcements", () => {
  assert.equal(announcementDestination(undefined), ANNOUNCEMENT_DESTINATION_DETAIL);
  assert.equal(
    announcementDestination(ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE),
    ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE,
  );
});

test("accepts a URL-safe announcement slug", () => {
  assert.equal(announcementSlugError("summer-event-2026"), null);
  assert.equal(announcementSlugError({ current: "summer-event-2026" }), null);
});

test("explains that a full URL must not be entered as an announcement slug", () => {
  assert.match(announcementSlugError("https://yia.jp/classes/foreign-language"), /URL全体ではなく/);
});

test("rejects characters that cannot be used in an announcement slug", () => {
  assert.match(announcementSlugError("Summer Event"), /半角小文字/);
});
