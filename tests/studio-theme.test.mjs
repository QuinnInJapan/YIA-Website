import assert from "node:assert/strict";
import test from "node:test";

import { yiaStudioTheme } from "../sanity/lib/studioTheme.ts";

test("uses a Japanese-first Studio font stack with readable body weight", () => {
  assert.match(yiaStudioTheme.fonts.text.family, /Hiragino Sans/);
  assert.match(yiaStudioTheme.fonts.text.family, /Yu Gothic UI/);
  assert.equal(yiaStudioTheme.fonts.text.weights.regular, 500);
  assert.equal(yiaStudioTheme.fonts.text.weights.semibold, 600);
  assert.equal(yiaStudioTheme.v2.font.text.weights.regular, 500);
});
