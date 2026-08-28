import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  legacyDocumentRedirects,
  legacyPageRedirects,
  siteRedirects,
} from "../lib/legacy-redirects.ts";

const manifest = JSON.parse(
  await readFile(
    new URL("../manual/yia-jp-scrape-2026-06-18/manifest.json", import.meta.url),
    "utf8",
  ),
);

test("covers every working HTML page captured from the old site", () => {
  const sources = new Set(legacyPageRedirects.map((redirect) => redirect.source));
  const archivedPaths = manifest.pages
    .map((page) => new URL(page.url).pathname)
    .filter((pathname) => pathname !== "/");

  assert.deepEqual(
    archivedPaths.filter((pathname) => !sources.has(pathname)),
    [],
  );
});

test("covers every downloadable document captured from the old site", () => {
  const sources = new Set(legacyDocumentRedirects.map((redirect) => redirect.source));
  const documentPaths = manifest.assets
    .map((asset) => new URL(asset.url).pathname)
    .filter((pathname) => /\.(?:pdf|docx?|xlsx?)$/i.test(pathname));

  assert.equal(documentPaths.length, 39);
  assert.deepEqual(
    documentPaths.filter((pathname) => !sources.has(pathname)),
    [],
  );
});

test("legacy redirect sources are unique and destinations are controlled", () => {
  const sources = siteRedirects.map((redirect) => redirect.source);
  assert.equal(new Set(sources).size, sources.length);

  for (const redirect of siteRedirects) {
    assert.equal(redirect.permanent, true);
    assert.match(redirect.destination, /^(?:\/|https:\/\/(?:yia\.jp|cdn\.sanity\.io)\/)/);
  }
});

test("the not-found page explains the redesign and provides a home link", async () => {
  const source = await readFile(new URL("../app/(site)/not-found.tsx", import.meta.url), "utf8");
  assert.match(source, /最近リニューアルされ/);
  assert.match(source, /href="\/"/);
  assert.match(source, /ホームページへ戻る/);
});
