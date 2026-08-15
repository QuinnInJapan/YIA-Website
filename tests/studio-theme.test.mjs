import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { yiaStudioTheme } from "../sanity/lib/studioTheme.ts";

const studioCss = await readFile(
  new URL("../app/studio/studio-overrides.css", import.meta.url),
  "utf8",
);

test("uses a Japanese-first Studio font stack with readable body weight", () => {
  assert.match(yiaStudioTheme.fonts.text.family, /Hiragino Sans/);
  assert.match(yiaStudioTheme.fonts.text.family, /Yu Gothic UI/);
  assert.equal(yiaStudioTheme.fonts.text.weights.regular, 500);
  assert.equal(yiaStudioTheme.fonts.text.weights.semibold, 600);
  assert.equal(yiaStudioTheme.v2.font.text.weights.regular, 500);
});

test("keeps native Sanity text and labels above the Studio readability floor", () => {
  assert.deepEqual(
    yiaStudioTheme.v2.font.text.sizes.map((size) => size.fontSize),
    [13, 15, 17, 19, 22],
  );
  assert.deepEqual(
    yiaStudioTheme.v2.font.label.sizes.map((size) => size.fontSize),
    [12, 13, 14, 15, 16, 17],
  );
  assert.ok(yiaStudioTheme.v2.font.text.sizes.every((size) => size.lineHeight > size.fontSize));
  assert.ok(yiaStudioTheme.v2.font.label.sizes.every((size) => size.lineHeight > size.fontSize));
});

test("keeps custom Studio controls and placeholders legible", () => {
  assert.match(studioCss, /\.studio-workspace\s*\{[^}]*line-height:\s*1\.5;/s);
  assert.match(studioCss, /:where\(button, input, textarea, select\)[^}]*font-weight:\s*inherit;/s);
  assert.match(
    studioCss,
    /:where\(input, textarea\)::placeholder[^}]*color:\s*var\(--input-placeholder-color\);[^}]*opacity:\s*1;/s,
  );
});
