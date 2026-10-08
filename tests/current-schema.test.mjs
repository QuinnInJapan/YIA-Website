import test from "node:test";
import assert from "node:assert/strict";
import { currentSchema, structuralIssues, validateCurrentDocument, assertCurrentDocument } from "../scripts/lib/current-schema.mjs";
import { patchWithRevision, i18n } from "../scripts/lib/sanity-tools.mjs";

const page = () => ({ _type: "page", _id: "page-fixture", _rev: "r1", slug: "fixture", title: i18n("日本語", "English"), sections: [] });

test("loads current document and section types rather than retired audit lists", async () => {
  const schema = currentSchema();
  assert.ok(schema.get("homepageFeatured"));
  for (const type of ["labelTable", "table", "infoCards", "imageCards"]) assert.ok(schema.get(type));
  assert.equal(schema.get("infoTable"), undefined);
  assert.deepEqual(await validateCurrentDocument(page(), { documentIds: new Set() }), []);
  assert.equal(typeof globalThis.window, "undefined");
});

test("finds nested unknown fields, legacy types, malformed bilingual arrays and duplicate keys", () => {
  const value = page();
  value.sections = [{ _type: "content", _key: "section", removedField: "private-text-sentinel" }];
  assert.ok(structuralIssues(value).some((issue) => issue.code === "unknown-field" && issue.path.at(-1) === "removedField"));
  value.sections[0]._type = "infoTable";
  assert.ok(structuralIssues(value).some((issue) => issue.code === "unknown-array-type"));
  value.title = "legacy title";
  assert.ok(structuralIssues(value).some((issue) => issue.code === "expected-array"));
  value.title = [{ _key: "ja", value: "A" }, { _key: "ja", value: "B" }];
  assert.ok(structuralIssues(value).some((issue) => issue.code === "missing-or-duplicate-key"));
});

test("runs actual required and custom Studio rules, and checks published reference existence", async () => {
  const value = page();
  delete value.slug;
  assert.ok((await validateCurrentDocument(value, { documentIds: new Set() })).some((issue) => issue.path[0] === "slug" && issue.level === "error"));
  value.slug = "fixture";
  value.categoryRef = { _type: "reference", _ref: "missing-category" };
  assert.ok((await validateCurrentDocument(value, { documentIds: new Set() })).some((issue) => issue.path[0] === "categoryRef"));
  assert.deepEqual(await validateCurrentDocument(value, { documentIds: new Set(["missing-category"]) }), []);
  const navigation = { _id: "navigation", _type: "navigation", categories: [{ _key: "a", _type: "object", categoryRef: { _type: "reference", _ref: "cat" }, items: [] }, { _key: "b", _type: "object", categoryRef: { _type: "reference", _ref: "cat" }, items: [] }] };
  assert.ok((await validateCurrentDocument(navigation, { documentIds: new Set(["cat"]) })).some((issue) => issue.level === "error"));
});

test("rejects invalid resulting API patches before any mutation and keeps errors content-free", async () => {
  let writes = 0;
  const client = { patch() { writes++; throw new Error("must not write"); } };
  await assert.rejects(patchWithRevision(client, page(), { title: "private-text-sentinel" }, { dryRun: false }), (error) => !error.message.includes("private-text-sentinel") && error.message.includes("Current schema"));
  assert.equal(writes, 0);
  await assert.rejects(assertCurrentDocument({ ...page(), removedField: "private-text-sentinel" }), (error) => !error.message.includes("private-text-sentinel"));
});
