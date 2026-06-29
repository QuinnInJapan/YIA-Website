import assert from "node:assert/strict";
import test from "node:test";

import { categoryPath, categorySegment, documentIdSegment, pagePath } from "../lib/routes.ts";

test("normalizes Sanity document ids to public route segments", () => {
  assert.equal(documentIdSegment("category-classes"), "classes");
  assert.equal(documentIdSegment("drafts.category-events"), "events");
  assert.equal(documentIdSegment("about"), "about");
  assert.equal(documentIdSegment(undefined), "");
});

test("builds category and page paths from Sanity category ids", () => {
  assert.equal(categorySegment("category-classes"), "classes");
  assert.equal(categoryPath("category-classes"), "/classes");
  assert.equal(pagePath("category-classes", "conversation-salon"), "/classes/conversation-salon");
});
