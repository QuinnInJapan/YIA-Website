import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { createClient } from "@sanity/client";
import { evaluate, parse } from "groq-js";
import { deleteAnnouncement } from "../sanity/components/announcements/delete-announcement.ts";
import { documentPairIds } from "../sanity/components/shared/draft-documents.ts";

const ids = documentPairIds("drafts.notice");
const reference = { _type: "reference", _ref: "notice", _key: "notice" };

function fixture(dataset = [], failure) {
  const client = createClient({
    projectId: "test",
    dataset: "development",
    apiVersion: "2024-01-01",
    useCdn: false,
  });
  const commits = [];
  client.fetch = async (query, params, options) => {
    assert.equal(options.perspective, "raw");
    return (await evaluate(parse(query), { dataset, params })).get();
  };
  client.mutate = async (mutations) => {
    if (failure) throw failure;
    commits.push(mutations);
    return {};
  };
  return { client, commits };
}

test("deletes both announcement versions and only matching legacy homepage references in one commit", async () => {
  const { client, commits } = fixture([
    {
      _id: "homepage",
      _type: "homepage",
      _rev: "pub",
      announcementRefs: [reference, { _ref: "other" }],
    },
    { _id: "drafts.homepage", _type: "homepage", _rev: "draft", announcementRefs: [reference] },
    { _id: "unrelated-homepage", _type: "homepage", announcementRefs: [{ _ref: "other" }] },
    { _id: "target-page", _type: "page", title: "Shared destination" },
  ]);
  await deleteAnnouncement(client, ids);
  assert.deepEqual(commits, [
    [
      ...[
        ["homepage", "pub"],
        ["drafts.homepage", "draft"],
      ].map(([id, revision]) => ({
        patch: {
          id,
          ifRevisionID: revision,
          unset: ['announcementRefs[_ref=="notice"]', 'announcementRefs[_ref=="drafts.notice"]'],
        },
      })),
      { delete: { id: "drafts.notice" } },
      { delete: { id: "notice" } },
    ],
  ]);
});

test("deletes unreferenced and draft-only announcements without touching other documents", async () => {
  const { client, commits } = fixture();
  await deleteAnnouncement(client, ids);
  assert.deepEqual(commits, [[{ delete: { id: "drafts.notice" } }, { delete: { id: "notice" } }]]);
});

test("propagates transaction failures instead of reporting successful deletion", async () => {
  const failure = new Error("Document is still referenced");
  const { client, commits } = fixture([], failure);
  await assert.rejects(deleteAnnouncement(client, ids), failure);
  assert.deepEqual(commits, []);
});

// Exercise the actual editor handler without requiring a logged-in Sanity browser.
const editor = readFileSync(
  new URL("../sanity/components/announcements/AnnouncementEditor.tsx", import.meta.url),
  "utf8",
);
const sourceFile = ts.createSourceFile(
  "editor.tsx",
  editor,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let deleteHandler;
function findHandler(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "handleDelete")
    deleteHandler = node.getText(sourceFile);
  ts.forEachChild(node, findHandler);
}
findHandler(sourceFile);

function handlerFixture(deleteOperation = async () => {}) {
  const events = [];
  const context = {
    deletingRef: { current: false },
    saveTimerRef: { current: 42 },
    pendingSavesRef: { current: new Set() },
    setSaving: (value) => events.push(["saving", value]),
    setErrorMessage: (value) => events.push(["error", value]),
    setConfirmAction: (value) => events.push(["confirm", value]),
    setSaveStatus: (value) => events.push(["status", value]),
    clearTimeout: (value) => events.push(["cancel", value]),
    deleteAnnouncement: deleteOperation,
    client: {},
    documentId: "notice",
    documentPairIds,
    onDelete: () => events.push(["deleted"]),
    console: { error() {} },
  };
  const compiled = ts.transpileModule(deleteHandler, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const run = new Function(...Object.keys(context), `${compiled}; return handleDelete;`)(
    ...Object.values(context),
  );
  return { context, events, run };
}

test("editor cancels queued autosave, waits for in-flight saves, and rejects duplicate delete clicks", async () => {
  let finishSave;
  let deletions = 0;
  const { context, events, run } = handlerFixture(async () => {
    deletions++;
  });
  context.pendingSavesRef.current.add(
    new Promise((resolve) => {
      finishSave = resolve;
    }),
  );
  const pending = run();
  await run();
  assert.equal(deletions, 0);
  assert.equal(context.saveTimerRef.current, null);
  assert.ok(events.some(([event, value]) => event === "cancel" && value === 42));
  finishSave(true);
  await pending;
  assert.equal(deletions, 1);
  assert.ok(events.some(([event]) => event === "deleted"));
  assert.equal(context.deletingRef.current, true);
});

test("editor keeps the announcement open and displays a retryable error on failure", async () => {
  const { context, events, run } = handlerFixture(async () => {
    throw new Error("Forbidden");
  });
  await run();
  assert.equal(context.deletingRef.current, false);
  assert.ok(!events.some(([event]) => event === "deleted"));
  assert.ok(
    events.some(([event, value]) => event === "error" && value?.includes("削除できません")),
  );
  assert.deepEqual(events.at(-1), ["saving", false]);
});
