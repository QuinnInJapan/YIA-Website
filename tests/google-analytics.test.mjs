import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import {
  GA_INITIALIZATION_SCRIPT,
  GA_MEASUREMENT_ID,
  analyticsLabel,
  createScrollDepthTracker,
  documentOpenParameters,
  formLinkParameters,
  linkAnalyticsEvents,
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

test("public labels are bounded and redact email addresses and URL answers", () => {
  assert.equal(analyticsLabel("  Application\n Guide  "), "Application Guide");
  assert.equal(analyticsLabel("Contact person@example.com"), "Contact [redacted]");
  assert.equal(
    analyticsLabel("https://forms.gle/example?answer=private#section"),
    "https://forms.gle/example",
  );
  assert.equal(analyticsLabel("a".repeat(140)).length, 100);
});

test("link events carry useful labels without contact recipients or prefilled answers", () => {
  const origin = "https://yia.example";
  const common = { placement: "content", label: "Application form" };
  assert.deepEqual(
    linkAnalyticsEvents({ ...common, href: "https://forms.gle/example?email=private" }, origin),
    [
      {
        event: "form_link_click",
        parameters: {
          link_domain: "forms.gle",
          form_path: "/example",
          link_placement: "content",
          link_label: "Application form",
        },
      },
    ],
  );
  for (const [href, method] of [
    ["mailto:secret@example.com?body=private", "email"],
    ["tel:+81460000000", "phone"],
  ]) {
    assert.deepEqual(linkAnalyticsEvents({ ...common, href, label: href }, origin), [
      {
        event: "contact_click",
        parameters: { method, link_placement: "content" },
      },
    ]);
  }
  assert.deepEqual(linkAnalyticsEvents({ ...common, href: "/classes" }, origin), []);
  assert.deepEqual(linkAnalyticsEvents({ ...common, href: "javascript:alert(1)" }, origin), []);
});

test("document links use original file metadata for inline and standalone viewers", () => {
  const origin = "https://yia.example";
  const metadata = { label: "申込書 / Application", placement: "sidebar" };
  const original = "https://cdn.sanity.io/files/p/d/guide.pdf?token=private#page=2";
  const events = linkAnalyticsEvents(
    { ...metadata, href: "/pdf-viewer?url=private", documentHref: original },
    origin,
  );
  assert.deepEqual(events, [
    {
      event: "document_open",
      parameters: {
        file_name: "guide.pdf",
        file_extension: "pdf",
        document_label: metadata.label,
        link_placement: "sidebar",
      },
    },
  ]);
  assert.equal(linkAnalyticsEvents({ ...metadata, href: original }, origin).length, 1);
});

test("scroll milestones fire once per page and ignore non-scrollable pages", () => {
  const track = createScrollDepthTracker();
  assert.deepEqual(track(0, 600, 600), []);
  assert.deepEqual(track(1, 600, 2400), [25]);
  assert.deepEqual(track(650, 600, 2400), [50]);
  assert.deepEqual(track(650, 600, 2400), []);
  assert.deepEqual(track(1650, 600, 2400), [75, 90]);
  assert.deepEqual(track(3000, 600, 2400), []);
  assert.deepEqual(createScrollDepthTracker()(650, 600, 2400), [25, 50]);
});

test("the browser component handles nested link clicks, route resets and listener cleanup", (t) => {
  const require = createRequire(import.meta.url);
  const source = readFileSync(
    new URL("../components/GoogleAnalytics.tsx", import.meta.url),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const effects = [];
  const events = [];
  const documentListeners = new Map();
  const windowListeners = new Map();
  const frames = new Map();
  let nextFrame = 0;
  const browser = {
    location: { origin: "https://yia.example", pathname: "/classes/conversation-salon" },
    scrollY: 650,
    innerHeight: 600,
    gtag: (...args) => events.push(args),
    addEventListener: (type, fn) => windowListeners.set(type, fn),
    removeEventListener: (type) => windowListeners.delete(type),
    requestAnimationFrame: (fn) => {
      frames.set(++nextFrame, fn);
      return nextFrame;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
  };
  const previousWindow = globalThis.window;
  globalThis.window = browser;
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });
  class Element {
    constructor(link) {
      this.link = link;
    }
    closest() {
      return this.link;
    }
  }
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    Element,
    window: browser,
    document: {
      documentElement: { scrollHeight: 2400 },
      body: { scrollHeight: 2400 },
      addEventListener: (type, fn) => documentListeners.set(type, fn),
      removeEventListener: (type) => documentListeners.delete(type),
    },
    require: (name) =>
      ({
        react: { useEffect: (fn) => effects.push(fn) },
        "next/script": { __esModule: true, default: "script" },
        "next/navigation": { usePathname: () => browser.location.pathname },
        "@/lib/google-analytics": {
          GA_INITIALIZATION_SCRIPT,
          GA_MEASUREMENT_ID,
          createScrollDepthTracker,
          linkAnalyticsEvents,
          trackAnalyticsEvent,
        },
      })[name] ?? require(name),
  });
  module.exports.default();
  const stopClicks = effects[0]();
  let stopScrolls = effects[1]();
  const link = {
    href: "https://forms.gle/application?entry.1=private",
    textContent: "Application",
    dataset: {},
    closest: () => null,
  };
  const target = new Element(link);
  documentListeners.get("click")({ type: "click", button: 0, target });
  assert.equal(events.length, 1);
  assert.equal(events[0][1], "form_link_click");
  assert.equal(events[0][2].page_path, browser.location.pathname);
  assert.ok(!JSON.stringify(events).includes("private"));
  documentListeners.get("click")({ type: "click", button: 2, target });
  documentListeners.get("click")({ type: "click", button: 0, target: {} });
  assert.equal(events.length, 1);
  documentListeners.get("auxclick")({ type: "auxclick", button: 1, target });
  assert.equal(events.length, 2);
  function flushFrames() {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((fn) => fn());
  }
  windowListeners.get("scroll")();
  windowListeners.get("scroll")();
  assert.equal(frames.size, 1);
  flushFrames();
  assert.deepEqual(
    events.slice(2).map((entry) => entry[2].percent_scrolled),
    [25, 50],
  );
  windowListeners.get("scroll")();
  flushFrames();
  assert.equal(events.length, 4);
  windowListeners.get("scroll")();
  stopScrolls();
  assert.equal(frames.size, 0);
  assert.equal(windowListeners.size, 0);
  browser.location.pathname = "/about/about";
  stopScrolls = effects[1]();
  windowListeners.get("scroll")();
  flushFrames();
  assert.equal(events.length, 6);
  assert.equal(events[5][2].page_path, "/about/about");
  stopScrolls();
  stopClicks();
  assert.equal(documentListeners.size, 0);
  assert.equal(windowListeners.size, 0);
  assert.ok(events.every((entry) => entry[1] !== "page_view"));
});

test("document events omit URL queries and fragments, including private tokens", () => {
  assert.deepEqual(
    documentOpenParameters(
      "https://cdn.sanity.io/files/p/d/guide.pdf?token=private#page=2",
      "https://yia.example",
    ),
    { file_name: "guide.pdf", file_extension: "pdf" },
  );
  for (const href of ["", "javascript:alert(1)", "mailto:person@example.com"]) {
    assert.equal(documentOpenParameters(href, "https://yia.example"), null);
  }
});

test("form clicks recognize real Google Forms and exclude prefilled answers", () => {
  assert.deepEqual(
    formLinkParameters(
      "https://docs.google.com/forms/d/e/example/viewform?entry.123=private#answer",
      "https://yia.example",
    ),
    { link_domain: "docs.google.com", form_path: "/forms/d/e/example/viewform" },
  );
  assert.ok(formLinkParameters("https://forms.gle/example", "https://yia.example"));
  assert.ok(
    formLinkParameters(
      "https://docs.google.com/forms/u/0/d/example/viewform",
      "https://yia.example",
    ),
  );
  for (const href of [
    "https://docs.google.com/document/d/example",
    "https://forms.gle.evil.example/form",
    "javascript:alert(1)",
    "/classes",
  ]) {
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
  globalThis.window = {
    gtag: () => {
      throw new Error("Blocked");
    },
  };
  assert.doesNotThrow(() => trackAnalyticsEvent("document_open", { file_name: "guide.pdf" }));
  const events = [];
  globalThis.window = { gtag: (...args) => events.push(args) };
  trackAnalyticsEvent("generate_lead", { method: "contact_form" });
  assert.deepEqual(events, [
    ["event", "generate_lead", { method: "contact_form", send_to: GA_MEASUREMENT_ID }],
  ]);
});

test("the actual public layout mounts GA4 once in production and excludes other environments", async () => {
  const source = readFileSync(new URL("../app/(site)/layout.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
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
      require: (name) =>
        name === "react/jsx-runtime"
          ? require(name)
          : (dependencies[name] ?? { __esModule: true, default: "other" }),
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
