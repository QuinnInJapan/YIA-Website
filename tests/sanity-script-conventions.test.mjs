import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

test("apply scripts use the shared Sanity script runner", () => {
  const scriptDir = "scripts";
  const applyScripts = readdirSync(scriptDir)
    .filter((file) => /^apply-.*\.mjs$/.test(file))
    .sort();

  assert.ok(applyScripts.length > 0);

  for (const file of applyScripts) {
    const source = readFileSync(join(scriptDir, file), "utf8");
    assert.match(source, /runSanityScript\s*\(/, `${file} should call runSanityScript`);
    assert.doesNotMatch(
      source,
      /from ["'](?:@sanity\/client|next-sanity|dotenv)["']/,
      `${file} should use scripts/lib/sanity-tools.mjs for Sanity env/client setup`,
    );
  }
});
