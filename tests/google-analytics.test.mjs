import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import {
  GA_INITIALIZATION_SCRIPT,
  GA_MEASUREMENT_ID,
  documentOpenParameters,
  formLinkParameters,
  trackAnalyticsEvent,
} from "../lib/google-analytics.ts";

test("initializes the supplied property and queues events before Google's script loads", () => {
  const browser = { dataLayer: [] };
  browser.window = browser;
  vm.runInNewContext(GA_INITIALIZATION_SCRIPT, browser);
  assert.deepEqual(Array.from(browser.dataLayer[1]), ["config", "G-5XYKT7ST20"]);
  browser.gtag("event", "document_open", { file_name: "guide.pdf" });
  assert.equal(browser.dataLayer[2][0], "event");
  assert.equal(browser.dataLayer[2][1], "document_open");
});

test("document events omit URL queries and fragments, including private tokens", () => {
  assert.deepEqual(
    documentOpenParameters("https://cdn.sanity.io/files/p/d/guide.pdf?token=private#page=2", "https://yia.example"),
    { file_name: "guide.pdf", file_extension: "pdf" },
  );
  for (const href of ["", "javascript:alert(1)", "mailto:person@example.com"]) {
    assert.equal(documentOpenParameters(href, "https://yia.example"), null);
  }
});

test("form clicks recognize real Google Forms and exclude prefilled answers", () => {
  assert.deepEqual(
    formLinkParameters("https://docs.google.com/forms/d/e/example/viewform?entry.123=private#answer", "https://yia.example"),
    { link_domain: "docs.google.com", form_path: "/forms/d/e/example/viewform" },
  );
  assert.ok(formLinkParameters("https://forms.gle/example", "https://yia.example"));
  assert.ok(formLinkParameters("https://docs.google.com/forms/u/0/d/example/viewform", "https://yia.example"));
  for (const href of ["https://docs.google.com/document/d/example", "https://forms.gle.evil.example/form", "javascript:alert(1)", "/classes"]) {
    assert.equal(formLinkParameters(href, "https://yia.example"), null);
  }
});

test("missing or failing telemetry cannot interrupt user actions", (t) => {
  const previousWindow = globalThis.window;
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });
  delete globalThis.window;
  assert.doesNotThrow(() => trackAnalyticsEvent("generate_lead", { method: "contact_form" }));
  globalThis.window = {};
  assert.doesNotThrow(() => trackAnalyticsEvent("language_change", { selected_language: "en" }));
  globalThis.window = { gtag: () => { throw new Error("Blocked"); } };
  assert.doesNotThrow(() => trackAnalyticsEvent("document_open", { file_name: "guide.pdf" }));
  const events = [];
  globalThis.window = { gtag: (...args) => events.push(args) };
  trackAnalyticsEvent("generate_lead", { method: "contact_form" });
  assert.deepEqual(events, [["event", "generate_lead", { method: "contact_form", send_to: GA_MEASUREMENT_ID }]]);
});

test("the actual public layout mounts GA4 once in production and excludes other environments", async () => {
  const source = readFileSync(new URL("../app/(site)/layout.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const require = createRequire(import.meta.url);
  for (const environment of [undefined, "development", "preview", "production"]) {
    const module = { exports: {} };
    const dependencies = {
      "@/components/GoogleAnalytics": { __esModule: true, default: "ga4" },
      "@vercel/analytics/next": { Analytics: "vercel-analytics" },
      "@vercel/speed-insights/next": { SpeedInsights: "speed-insights" },
    };
    vm.runInNewContext(compiled, {
      module,
      exports: module.exports,
      process: { env: { VERCEL_ENV: environment } },
      require: (name) => name === "react/jsx-runtime"
        ? require(name)
        : dependencies[name] ?? { __esModule: true, default: "other" },
    });
    const tree = await module.exports.default({ children: "Public content" });
    const types = [];
    function visit(node) {
      if (Array.isArray(node)) return node.forEach(visit);
      if (node && typeof node === "object") {
        types.push(node.type);
        visit(node.props?.children);
      }
    }
    visit(tree);
    const expected = environment === "production" ? 1 : 0;
    assert.equal(types.filter((type) => type === "ga4").length, expected, environment);
    assert.equal(types.filter((type) => type === "vercel-analytics").length, expected, environment);
    assert.equal(module.exports.revalidate, false);
  }
});
