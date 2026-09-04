import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("package exposes standard local verification scripts", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));

  assert.equal(pkg.scripts["test:unit"], "node --test --experimental-strip-types tests/*.test.mjs");
  assert.equal(pkg.scripts.test, "npm run typecheck && npm run test:unit");
  assert.equal(pkg.scripts["sanity:sync-dev"], "node scripts/sync-production-to-development.mjs");
});
