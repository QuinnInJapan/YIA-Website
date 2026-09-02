import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const toolbarButton = await readFile(
  new URL("../sanity/components/shared/RichTextToolbarButton.tsx", import.meta.url),
  "utf8",
);
const fullEditor = await readFile(
  new URL("../sanity/components/blog/PteEditor.tsx", import.meta.url),
  "utf8",
);
const simpleEditor = await readFile(
  new URL("../sanity/components/shared/SimpleBodyEditor.tsx", import.meta.url),
  "utf8",
);
const studioCss = await readFile(
  new URL("../app/studio/studio-overrides.css", import.meta.url),
  "utf8",
);

test("rich-text controls preserve selection and remain keyboard activatable", () => {
  assert.match(toolbarButton, /onMouseDown=\{handleMouseDown\}/);
  assert.match(toolbarButton, /onClick=\{handleClick\}/);
  assert.match(toolbarButton, /onKeyDown=\{handleKeyDown\}/);
  assert.match(toolbarButton, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(toolbarButton, /event\.detail === 0/);
  assert.match(toolbarButton, /aria-pressed=\{pressed\}/);
  assert.doesNotMatch(toolbarButton, /border:\s*["'`]/);
});

test("both editor toolbars expose active decorator and list states", () => {
  for (const source of [fullEditor, simpleEditor]) {
    assert.match(source, /selectors\.isActiveDecorator\("strong"\)/);
    assert.match(source, /selectors\.isActiveDecorator\("em"\)/);
    assert.match(source, /selectors\.isActiveListItem\("bullet"\)/);
    assert.match(source, /selectors\.isActiveListItem\("number"\)/);
  }
});

test("editing and preview surfaces restore meaningful rich-text emphasis", () => {
  assert.match(fullEditor, /fontWeight:\s*400,/);
  assert.match(simpleEditor, /fontWeight:\s*400,/);
  assert.match(studioCss, /:where\(strong, b\)[^{]*\{[^}]*font-weight:\s*700;/s);
  assert.match(studioCss, /:where\(em, i\)[^{]*\{[^}]*font-style:\s*italic;/s);
});
