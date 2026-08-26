import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  cell,
  fail,
  formatFailure,
  i18n,
  loadSanityEnv,
  parseScriptFlags,
  patchWithRevision,
  validateAnnouncementForMutation,
} from "../scripts/lib/sanity-tools.mjs";

test("parseScriptFlags defaults to dry-run", () => {
  assert.deepEqual(parseScriptFlags([]), { dryRun: true, live: false, args: [] });
});

test("parseScriptFlags can preserve a legacy live default", () => {
  assert.deepEqual(parseScriptFlags([], { defaultLive: true }), {
    dryRun: false,
    live: true,
    args: [],
  });
  assert.deepEqual(parseScriptFlags(["--dry-run", "page-id"], { defaultLive: true }), {
    dryRun: true,
    live: false,
    args: ["page-id"],
  });
});

test("parseScriptFlags requires --live for live mode", () => {
  assert.deepEqual(parseScriptFlags(["--live", "page-id"]), {
    dryRun: false,
    live: true,
    args: ["page-id"],
  });
});

test("parseScriptFlags rejects conflicting modes", () => {
  assert.throws(
    () => parseScriptFlags(["--dry-run", "--live"]),
    /Choose either --dry-run or --live/,
  );
});

test("runSanityScript formats flag errors from the real template entrypoint", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/sanity-script-template.mjs", "--dry-run", "--live"],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /ERROR/);
  assert.match(result.stderr, /WHY/);
  assert.match(result.stderr, /FIX/);
  assert.doesNotMatch(result.stderr, /SanityScriptError:/);
});

test("i18n and cell create standard bilingual arrays", () => {
  assert.deepEqual(i18n("日本語", "English"), [
    { _key: "ja", value: "日本語" },
    { _key: "en", value: "English" },
  ]);
  assert.deepEqual(cell("10:00", "10:00"), i18n("10:00", "10:00"));
});

test("loadSanityEnv fails loudly when env is missing", () => {
  assert.throws(
    () => loadSanityEnv({ env: {}, envPath: "/tmp/does-not-matter.env", loadDotenv: false }),
    /Missing required Sanity environment variables/,
  );
});

test("formatFailure prints loud actionable sections", () => {
  const error = fail("Missing page", { fix: "Check the page id", context: { id: "page-x" } });
  const formatted = formatFailure(error);
  assert.match(formatted, /ERROR/);
  assert.match(formatted, /WHY/);
  assert.match(formatted, /FIX/);
  assert.match(formatted, /CONTEXT/);
});

test("formatFailure wraps unexpected errors with a default fix", () => {
  const formatted = formatFailure(
    Object.assign(new Error("network failed"), { code: "ENOTFOUND" }),
  );
  assert.match(formatted, /ERROR/);
  assert.match(formatted, /WHY/);
  assert.match(formatted, /FIX/);
  assert.match(formatted, /CONTEXT/);
  assert.match(formatted, /ENOTFOUND/);
});

test("announcement mutation validation accepts both supported destination shapes", () => {
  assert.deepEqual(validateAnnouncementForMutation({ slug: { current: "summer-event" } }), {
    destinationType: "detail",
    slug: "summer-event",
  });
  assert.deepEqual(
    validateAnnouncementForMutation({
      destinationType: "internalPage",
      targetPage: { _type: "reference", _ref: "page-foreign-language" },
      targetAnchor: "sec-申込み方法",
    }),
    { destinationType: "internalPage", targetAnchor: "sec-申込み方法" },
  );
});

test("announcement mutation validation rejects full URLs and missing page references", () => {
  assert.throws(
    () => validateAnnouncementForMutation({ slug: { current: "https://yia.jp/page" } }),
    /invalid slug/,
  );
  assert.throws(
    () => validateAnnouncementForMutation({ destinationType: "internalPage" }),
    /missing targetPage/,
  );
  assert.throws(
    () =>
      validateAnnouncementForMutation({
        destinationType: "internalPage",
        targetPage: { _ref: "page-foreign-language" },
        targetAnchor: "申込み方法",
      }),
    /invalid targetAnchor/,
  );
});

test("patchWithRevision prevents writes in dry-run mode", async () => {
  let called = false;
  const client = {
    patch() {
      called = true;
      throw new Error("should not write");
    },
  };

  const result = await patchWithRevision(
    client,
    { _id: "page-test", _rev: "rev-1" },
    { title: "new" },
    { dryRun: true },
  );

  assert.equal(called, false);
  assert.equal(result.dryRun, true);
});

test("patchWithRevision uses revision guards in live mode", async () => {
  const calls = [];
  const client = {
    patch(id) {
      calls.push(["patch", id]);
      return {
        ifRevisionId(rev) {
          calls.push(["ifRevisionId", rev]);
          return this;
        },
        set(value) {
          calls.push(["set", value]);
          return this;
        },
        async commit() {
          calls.push(["commit"]);
          return { ok: true };
        },
      };
    },
  };

  await patchWithRevision(
    client,
    { _id: "page-test", _rev: "rev-1" },
    { title: "new" },
    {
      dryRun: false,
    },
  );

  assert.deepEqual(calls, [
    ["patch", "page-test"],
    ["ifRevisionId", "rev-1"],
    ["set", { title: "new" }],
    ["commit"],
  ]);
});
