import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("site layout owns skip link styles outside globals", () => {
  const globals = readFileSync("app/globals.css", "utf8");
  const layout = readFileSync("app/(site)/layout.tsx", "utf8");
  const layoutCss = readFileSync("app/(site)/layout.module.css", "utf8");

  assert.equal(globals.includes(".skip-link"), false);
  assert.equal(layout.includes("styles.skipLink"), true);
  assert.equal(layoutCss.includes(".skipLink"), true);
});
