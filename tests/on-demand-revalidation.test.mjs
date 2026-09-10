import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as revalidation from "../lib/sanity/revalidation.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("public route configs cannot reintroduce timed ISR", () => {
  const files = readdirSync(new URL("app/", root), { recursive: true })
    .filter((path) => /\.(ts|tsx)$/.test(path));
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
  assert.equal(revalidation.sanityFetchOptions.next.revalidate, false);
  assert.deepEqual(revalidation.sanityFetchOptions.next.tags, [revalidation.SANITY_SITE_DATA_TAG]);
});

test("page and sitemap Sanity reads all participate in webhook invalidation", () => {
  for (const file of ["lib/sanity/queries.ts", "lib/sanity/navigation-routes.ts", "app/sitemap.ts"]) {
    const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
    let calls = 0;
    function visit(node) {
      if (ts.isCallExpression(node) && node.expression.getText(source) === "client.fetch") {
        calls++;
        assert.equal(node.arguments[2]?.getText(source), "sanityFetchOptions", file);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    assert.ok(calls > 0, file);
  }
});

function loadHandler(secret = "test-secret") {
  const calls = [];
  const exports = {};
  const code = ts.transpileModule(read("app/api/revalidate/route.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(code, {
    exports,
    process: { env: { SANITY_REVALIDATE_SECRET: secret } },
    require(name) {
      if (name === "next/cache") return {
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

test("a publish expires shared data before invalidating the affected pages", async () => {
  const { post, calls } = loadHandler();
  const response = await post(request({ "x-sanity-revalidate-secret": "test-secret" }));
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ["tag", revalidation.SANITY_SITE_DATA_TAG, { expire: 0 }],
    ["path", "/", "page"],
    ["path", "/events", "page"],
    ["path", "/events/test", "page"],
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
