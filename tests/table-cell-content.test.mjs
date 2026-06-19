import assert from "node:assert/strict";
import test from "node:test";

import { getDisplayCellContent } from "../components/table-cell-content.ts";

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
