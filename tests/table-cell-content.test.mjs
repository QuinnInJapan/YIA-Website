import assert from "node:assert/strict";
import test from "node:test";

import { getDisplayCellContent, getHyperlinkCellHref } from "../components/table-cell-content.ts";

test("suppresses identical bilingual table cell values", () => {
  assert.deepEqual(
    getDisplayCellContent([
      { _key: "ja", value: "10:00〜12:00" },
      { _key: "en", value: "10:00-12:00" },
    ]),
    {
      primary: "10:00〜12:00",
      secondary: "",
      isSingle: true,
    },
  );
});

test("keeps real bilingual table cell values", () => {
  assert.deepEqual(
    getDisplayCellContent([
      { _key: "ja", value: "月" },
      { _key: "en", value: "Mon" },
    ]),
    {
      primary: "月",
      secondary: "Mon",
      isSingle: false,
    },
  );
});

test("returns sanitized hrefs for matching table hyperlink cells", () => {
  assert.equal(
    getHyperlinkCellHref(
      [
        { _key: "first", colKey: "name", href: " https://example.org/profile " },
        { _key: "second", colKey: "other", href: "https://example.org/other" },
      ],
      "name",
    ),
    "https://example.org/profile",
  );
});

test("rejects unsafe table hyperlink hrefs", () => {
  assert.equal(
    getHyperlinkCellHref([{ _key: "first", colKey: "name", href: "javascript:alert(1)" }], "name"),
    undefined,
  );
});
