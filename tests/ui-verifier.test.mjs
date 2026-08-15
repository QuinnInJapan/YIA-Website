import assert from "node:assert/strict";
import test from "node:test";

import { expandCases, validateBaseUrl, validateManifest } from "../scripts/verify-ui.mjs";

test("UI verification is limited to managed loopback-style origins", () => {
  assert.equal(validateBaseUrl("http://127.0.0.1:4306").port, "4306");
  assert.throws(() => validateBaseUrl("https://example.com"), /loopback HTTP/u);
});

test("UI manifest expands deterministically", () => {
  const manifest = validateManifest({schemaVersion: 1, project: "demo", viewports: [{id: "wide", width: 1200, height: 800}], routes: [{id: "home", path: "/"}]});
  assert.deepEqual(expandCases(manifest).map(({route, viewport}) => `${route.id}:${viewport.id}`), ["home:wide"]);
});
