import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { createClient } from "@sanity/client";
import { evaluate, parse } from "groq-js";
import {
  setAnnouncementTrashed,
  publishActiveAnnouncement,
} from "../sanity/components/announcements/announcement-trash.ts";
import { documentPairIds } from "../sanity/components/shared/draft-documents.ts";

const ids = documentPairIds("drafts.notice");
const versions = [
  { _id: "notice", _type: "announcement", _rev: "pub", title: "Published" },
  { _id: "drafts.notice", _type: "announcement", _rev: "draft", title: "Unpublished changes" },
];

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

test("trash atomically marks both versions without deleting content, assets, destinations or references", async () => {
  const { client, commits } = fixture([
    {
      _id: "homepage",
      _type: "homepage",
      _rev: "pub",
      announcementRefs: [{ _ref: "notice" }, { _ref: "other" }],
    },
    ...versions,
    { _id: "unrelated-homepage", _type: "homepage", announcementRefs: [{ _ref: "other" }] },
    { _id: "target-page", _type: "page", title: "Shared destination" },
  ]);
  await setAnnouncementTrashed(client, ids, true);
  const trashedAt = commits[0][0].patch.set.trashedAt;
  assert.ok(Number.isFinite(Date.parse(trashedAt)));
  assert.deepEqual(commits, [
    [
      ...[
        ["notice", "pub"],
        ["drafts.notice", "draft"],
      ].map(([id, revision]) => ({
        patch: {
          id,
          ifRevisionID: revision,
          set: { trashedAt },
        },
      })),
    ],
  ]);
});

test("restores both versions without promoting draft edits to published content", async () => {
  const { client, commits } = fixture(
    versions.map((v) => ({ ...v, trashedAt: "2026-10-20T00:00:00Z" })),
  );
  await setAnnouncementTrashed(client, ids, false);
  assert.deepEqual(commits, [
    versions.map((v) => ({
      patch: {
        id: v._id,
        ifRevisionID: v._rev,
        unset: ["trashedAt"],
      },
    })),
  ]);
});

test("draft-only trash and restore never creates a published document", async () => {
  const { client, commits } = fixture([versions[1]]);
  await setAnnouncementTrashed(client, ids, true);
  await setAnnouncementTrashed(client, ids, false);
  assert.ok(
    commits.every((mutations) => mutations.length === 1 && mutations[0].patch.id === ids.draftId),
  );
});

test("missing announcements cannot be reported as restored", async () => {
  const { client } = fixture();
  await assert.rejects(setAnnouncementTrashed(client, ids, false), /見つかりません/);
});

test("stale editors cannot publish a trashed announcement", async () => {
  for (const trashedId of [ids.publishedId, ids.draftId]) {
    const { client, commits } = fixture(
      versions.map((v) => ({
        ...v,
        ...(v._id === trashedId ? { trashedAt: "2026-10-20T00:00:00Z" } : {}),
      })),
    );
    await assert.rejects(publishActiveAnnouncement(client, ids, versions[0]), /ゴミ箱/);
    assert.deepEqual(commits, []);
  }
});

test("publishing guards both revisions against a concurrent trash operation", async () => {
  const { client, commits } = fixture(versions);
  await publishActiveAnnouncement(client, ids, versions[0]);
  assert.deepEqual(commits, [
    [
      ...versions.map((v) => ({ patch: { id: v._id, ifRevisionID: v._rev, set: {} } })),
      { createOrReplace: versions[0] },
      { delete: { id: ids.draftId } },
    ],
  ]);
});

test("propagates transaction failures instead of reporting successful deletion", async () => {
  const failure = new Error("Revision conflict");
  const { client, commits } = fixture(versions, failure);
  await assert.rejects(setAnnouncementTrashed(client, ids, true), failure);
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
let restoreHandler;
function findHandler(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "handleDelete")
    deleteHandler = node.getText(sourceFile);
  if (ts.isFunctionDeclaration(node) && node.name?.text === "handleRestore")
    restoreHandler = node.getText(sourceFile);
  ts.forEachChild(node, findHandler);
}
findHandler(sourceFile);

function handlerFixture(deleteOperation = async () => {}, saveOperation = async () => true) {
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
    setAnnouncementTrashed: deleteOperation,
    edits: {},
    saveToSanity: saveOperation,
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
  const restoreCode = ts.transpileModule(restoreHandler, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const restore = new Function(...Object.keys(context), `${restoreCode}; return handleRestore;`)(
    ...Object.values(context),
  );
  return { context, events, run, restore };
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
    events.some(([event, value]) => event === "error" && value?.includes("移動できません")),
  );
  assert.deepEqual(events.at(-1), ["saving", false]);
});

test("trash saves unsaved edits first and aborts when that save fails", async () => {
  for (const saved of [true, false]) {
    const order = [];
    const { context, events, run } = handlerFixture(
      async () => order.push("trash"),
      async () => {
        order.push("save");
        return saved;
      },
    );
    context.edits.title = [{ _key: "ja", value: "Last edit" }];
    await run();
    assert.deepEqual(order, saved ? ["save", "trash"] : ["save"]);
    assert.equal(
      events.some(([event]) => event === "deleted"),
      saved,
    );
  }
});

test("Studio filters separate trash from active announcements while deduplicating draft pairs", async () => {
  const source = readFileSync(
    new URL("../sanity/components/AnnouncementsTool.tsx", import.meta.url),
    "utf8",
  );
  const ast = ts.createSourceFile(
    "tool.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const snippets = ast.statements
    .filter(
      (node) =>
        (ts.isFunctionDeclaration(node) && ["buildFilter", "todayStr"].includes(node.name?.text)) ||
        (ts.isVariableStatement(node) &&
          node.declarationList.declarations.some((d) => d.name.getText(ast) === "DEDUP_FILTER")),
    )
    .map((node) => node.getText(ast))
    .join("\n");
  const compiled = ts.transpileModule(snippets, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const buildFilter = new Function(compiled + "; return buildFilter;")();
  const active = { _id: "active", _type: "announcement", pinned: true, date: "2000-01-01" };
  const trashed = { ...active, _id: "trashed", trashedAt: "2026-10-20T00:00:00Z" };
  const dataset = [
    active,
    { ...active, _id: "drafts.active" },
    trashed,
    { ...trashed, _id: "drafts.trashed" },
    { ...trashed, _id: "drafts.only-trash" },
  ];
  for (const mode of ["all", "pinned", "past", "upcoming", "trash"]) {
    const docs = await (await evaluate(parse(`*[${buildFilter("", mode)}]`), { dataset })).get();
    assert.deepEqual(
      docs.map((d) => d._id),
      mode === "trash" ? ["trashed", "drafts.only-trash"] : mode === "upcoming" ? [] : ["active"],
    );
  }
  assert.doesNotThrow(() => parse(`*[${buildFilter('quoted"search', "trash")}]`));
});

test("restore UI closes only after success and allows retry after failure", async () => {
  for (const fail of [false, true]) {
    const { context, events, restore } = handlerFixture(async (_client, pair, trashed) => {
      assert.deepEqual(pair, ids);
      assert.equal(trashed, false);
      if (fail) throw new Error("Permission denied");
    });
    await restore();
    assert.equal(
      events.some(([event]) => event === "deleted"),
      !fail,
    );
    assert.equal(context.deletingRef.current, !fail);
    if (fail)
      assert.ok(
        events.some(([event, value]) => event === "error" && value?.includes("復元できません")),
      );
    assert.deepEqual(events.at(-1), ["saving", false]);
  }
});

test("the drafts dashboard hides trash including drafts created by a stale editor", async () => {
  const source = readFileSync(
    new URL("../sanity/components/DraftsTool.tsx", import.meta.url),
    "utf8",
  );
  const query = source
    .match(/const DRAFTS_QUERY = `([\s\S]*?)`;/)[1]
    .replace("${ANNOUNCEMENT_PUBLICATION_FIELD_LIST}", "title");
  const dataset = [
    { _id: "drafts.active", _type: "announcement" },
    { _id: "drafts.page", _type: "page" },
    { _id: "drafts.trash", _type: "announcement", trashedAt: "2026-10-20T00:00:00Z" },
    { _id: "published-trash", _type: "announcement", trashedAt: "2026-10-20T00:00:00Z" },
    { _id: "drafts.published-trash", _type: "announcement" },
  ];
  const docs = await (
    await evaluate(parse(query), { dataset, params: { editableTypes: ["page", "announcement"] } })
  ).get();
  assert.deepEqual(
    docs.map((doc) => doc._id),
    ["drafts.active", "drafts.page"],
  );
});
