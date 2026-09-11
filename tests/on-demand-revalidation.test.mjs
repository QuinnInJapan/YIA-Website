import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as crypto from "node:crypto";
import * as revalidation from "../lib/sanity/revalidation.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("public route configs cannot reintroduce timed ISR", () => {
  const files = readdirSync(new URL("app/", root), { recursive: true }).filter((path) =>
    /\.(ts|tsx)$/.test(path),
  );
  let configs = 0;
  for (const path of files) {
    const source = ts.createSourceFile(path, read("app/" + path), ts.ScriptTarget.Latest, true);
    for (const statement of source.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (declaration.name.getText(source) !== "revalidate") continue;
        configs++;
        assert.equal(declaration.initializer?.kind, ts.SyntaxKind.FalseKeyword, path);
      }
    }
  }
  assert.ok(configs >= 9, "include public pages, layout, sitemap, and social image");
  assert.equal(revalidation.sanityFetchOptions("sanity:test").next.revalidate, false);
  assert.deepEqual(revalidation.sanityFetchOptions("sanity:test").next.tags, [
    revalidation.SANITY_SITE_DATA_TAG,
    "sanity:test",
  ]);
});

test("page and sitemap Sanity reads all participate in webhook invalidation", () => {
  for (const file of [
    "lib/sanity/queries.ts",
    "lib/sanity/navigation-routes.ts",
    "app/sitemap.ts",
  ]) {
    const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
    let calls = 0;
    function visit(node) {
      if (ts.isCallExpression(node) && node.expression.getText(source) === "client.fetch") {
        calls++;
        const options = node.arguments[2];
        assert.ok(options && ts.isCallExpression(options), file);
        assert.equal(options.expression.getText(source), "sanityFetchOptions", file);
        assert.ok(
          options.arguments.length > 0,
          "each query must have a specific dependency: " + file,
        );
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    assert.ok(calls > 0, file);
  }
});

function loadHandler(secret = "test-secret", extraEnv = {}) {
  const calls = [];
  const exports = {};
  const code = ts.transpileModule(read("app/api/revalidate/route.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(code, {
    exports,
    process: { env: { SANITY_REVALIDATE_SECRET: secret, ...extraEnv } },
    require(name) {
      if (name === "node:crypto") return crypto;
      if (name === "next/cache")
        return {
          revalidateTag: (...args) => calls.push(["tag", ...args]),
          revalidatePath: (...args) => calls.push(["path", ...args]),
        };
      if (name === "next/server") return { NextResponse: Response };
      if (name === "@/lib/sanity/revalidation") return revalidation;
      throw new Error("Unexpected dependency: " + name);
    },
  });
  return { post: exports.POST, calls };
}

function request(headers, body = '{"_type":"page","slug":"test","category":"events"}') {
  const req = new Request("https://example.test/api/revalidate", { method: "POST", headers, body });
  req.nextUrl = new URL(req.url);
  return req;
}

test("a body publish expires only its document cache and uses no broad path purge", async () => {
  const { post, calls } = loadHandler();
  const doc = { _id: "page-test", _type: "page", slug: "test", title: [] };
  const response = await post(
    request(
      { "x-sanity-revalidate-secret": "test-secret" },
      JSON.stringify({ schemaVersion: 1, before: doc, after: { ...doc, sections: ["new body"] } }),
    ),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ["tag", revalidation.sanityDocumentTag("page", "test"), { expire: 0 }],
    ["tag", revalidation.sanityDocumentTag("page", "page-test"), { expire: 0 }],
  ]);
  assert.equal((await response.json()).ok, true);
});

test("invalid or unauthenticated requests cannot trigger cache writes", async () => {
  for (const [secret, headers, body, status] of [
    ["test-secret", {}, "{}", 401],
    ["test-secret", { authorization: "Bearer wrong" }, "{}", 401],
    ["", { authorization: "Bearer test-secret" }, "{}", 500],
    ["test-secret", { authorization: "Bearer test-secret" }, "{", 400],
  ]) {
    const { post, calls } = loadHandler(secret);
    assert.equal((await post(request(headers, body))).status, status);
    assert.deepEqual(calls, []);
  }
});

test("the existing Sanity Bearer header remains supported", async () => {
  const { post, calls } = loadHandler();
  assert.equal((await post(request({ authorization: "Bearer test-secret" }))).status, 200);
  assert.equal(calls[0][0], "tag");
});

test("rotation accepts both credentials only during the configured overlap", async () => {
  const future = new Date(Date.now() + 60_000).toISOString();
  for (const value of ["new-secret", "old-secret"]) {
    const { post, calls } = loadHandler("new-secret", {
      SANITY_REVALIDATE_SECRET_PREVIOUS: "old-secret",
      SANITY_REVALIDATE_SECRET_PREVIOUS_UNTIL: future,
    });
    assert.equal((await post(request({ authorization: `Bearer ${value}` }, "{}"))).status, 200);
    assert.deepEqual(calls, []);
  }
});

test("expired, absent or malformed overlap deadlines reject the old credential", async () => {
  for (const deadline of [undefined, "", "invalid", new Date(Date.now() - 1000).toISOString()]) {
    const { post, calls } = loadHandler("new-secret", {
      SANITY_REVALIDATE_SECRET_PREVIOUS: "old-secret",
      SANITY_REVALIDATE_SECRET_PREVIOUS_UNTIL: deadline,
    });
    assert.equal((await post(request({ authorization: "Bearer old-secret" }))).status, 401);
    assert.equal((await post(request({ authorization: "Bearer new-secret" }, "{}"))).status, 200);
    assert.deepEqual(calls, []);
  }
});

test("overlap never permits missing credentials, arbitrary credentials or missing primary configuration", async () => {
  const env = {
    SANITY_REVALIDATE_SECRET_PREVIOUS: "old-secret",
    SANITY_REVALIDATE_SECRET_PREVIOUS_UNTIL: new Date(Date.now() + 60_000).toISOString(),
  };
  for (const headers of [{}, { authorization: "Bearer wrong" }]) {
    const { post, calls } = loadHandler("new-secret", env);
    assert.equal((await post(request(headers))).status, 401);
    assert.deepEqual(calls, []);
  }
  const { post, calls } = loadHandler("", env);
  assert.equal((await post(request({ authorization: "Bearer old-secret" }))).status, 500);
  assert.deepEqual(calls, []);
});
