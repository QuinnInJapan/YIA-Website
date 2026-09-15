import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";

function loadRoute(path) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  runInNewContext(code, {
    exports,
    require(name) {
      if (name === "react/jsx-runtime") return jsxRuntime;
      if (name === "next/navigation") return { notFound() { throw new Error("not-found"); } };
      if (name === "@/lib/data") return {
        getCategoryIds: async () => ["classes"],
        getCategoryIdsStatic: async () => ["classes", "announcements"],
      };
      if (name === "@/lib/i18n") return { ja: () => "" };
      if (name === "@/lib/site-metadata") return { pageMetadata: (value) => value };
      if (name.startsWith("@/components/templates/")) return { default: name };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports;
}

test("ordinary categories render without touching request query parameters", async () => {
  const route = loadRoute("../app/(site)/[category]/page.tsx");
  const result = await route.default({
    params: Promise.resolve({ category: "classes" }),
    get searchParams() { throw new Error("query access prevents static rendering"); },
  });
  assert.equal(result.props.categoryId, "classes");
  const paths = await route.generateStaticParams();
  assert.equal(JSON.stringify(paths), JSON.stringify([{ category: "classes" }]));
  await assert.rejects(route.default({ params: Promise.resolve({ category: "missing" }) }), /not-found/);
});

test("announcement listing preserves query pagination and canonical metadata", async () => {
  const route = loadRoute("../app/(site)/announcements/page.tsx");
  for (const [input, expected] of [[undefined, 1], ["2", 2], ["0", 1], ["-2", 1], ["bad", 1]]) {
    const result = await route.default({ searchParams: Promise.resolve({ page: input }) });
    assert.equal(result.props.page, expected);
  }
  assert.equal(route.metadata.pathname, "/announcements");
  assert.equal(route.metadata.title, "お知らせ");
});
