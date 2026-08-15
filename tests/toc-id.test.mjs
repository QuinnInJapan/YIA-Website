import assert from "node:assert/strict";
import test from "node:test";

import { tocId } from "../lib/toc-id.ts";

test("tocId preserves the first public anchor and suffixes repeated headings", () => {
  assert.equal(tocId("こども・学生向けクラス"), "sec-こども・学生向けクラス");
  assert.equal(tocId("こども・学生向けクラス", 1), "sec-こども・学生向けクラス--2");
  assert.equal(tocId("Two words", 2), "sec-Two-words--3");
});
