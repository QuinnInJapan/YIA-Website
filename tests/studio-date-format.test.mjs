import assert from "node:assert/strict";
import test from "node:test";

import {
  formatStudioDateOnly,
  formatStudioDateTime,
  formatStudioRelativeTime,
} from "../sanity/components/shared/date-format.ts";

test("formats draft dates with the existing Studio labels", () => {
  assert.equal(formatStudioDateOnly(null), "下書き");
  assert.equal(formatStudioDateTime(null), "下書き");
});

test("formats date-only values the same way as announcement lists", () => {
  assert.equal(
    formatStudioDateOnly("2026-06-01"),
    new Date("2026-06-01T00:00:00").toLocaleDateString("ja-JP"),
  );
});

test("formats date-time values the same way as blog lists", () => {
  assert.equal(
    formatStudioDateTime("2026-06-01T15:30:00Z"),
    new Date("2026-06-01T15:30:00Z").toLocaleDateString("ja-JP"),
  );
});

test("formats relative draft timestamps with the existing Japanese labels", () => {
  const now = Date.parse("2026-06-01T12:00:00Z");

  assert.equal(formatStudioRelativeTime(null, now), "");
  assert.equal(formatStudioRelativeTime("2026-06-01T11:59:45Z", now), "たった今");
  assert.equal(formatStudioRelativeTime("2026-06-01T11:45:00Z", now), "15分前");
  assert.equal(formatStudioRelativeTime("2026-06-01T09:00:00Z", now), "3時間前");
  assert.equal(formatStudioRelativeTime("2026-05-30T12:00:00Z", now), "2日前");
  assert.equal(
    formatStudioRelativeTime("2026-04-01T12:00:00Z", now),
    new Date("2026-04-01T12:00:00Z").toLocaleDateString("ja-JP"),
  );
});
