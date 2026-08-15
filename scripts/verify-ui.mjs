import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function validateBaseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(url.hostname) || url.username || url.password) throw new Error("UI verification base URL must be unauthenticated loopback HTTP");
  return url;
}

export function validateManifest(document) {
  if (document.schemaVersion !== 1 || typeof document.project !== "string" || !Array.isArray(document.routes) || !Array.isArray(document.viewports)) throw new Error("invalid UI verification manifest");
  const ids = new Set();
  for (const viewport of document.viewports) {
    if (typeof viewport.id !== "string" || ids.has(viewport.id) || !Number.isInteger(viewport.width) || !Number.isInteger(viewport.height) || viewport.width < 320 || viewport.height < 480) throw new Error("invalid or duplicate UI verification viewport");
    ids.add(viewport.id);
  }
  for (const route of document.routes) if (typeof route.id !== "string" || !route.path?.startsWith("/") || route.path.startsWith("//")) throw new Error("invalid UI verification route");
  return document;
}

export function expandCases(document) {
  return document.routes.flatMap((route) => document.viewports.map((viewport) => ({route, viewport})));
}

async function audit(page) {
  return page.evaluate(() => {
    const ids = [...document.querySelectorAll("[id]")].map((element) => element.id).filter(Boolean);
    const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))].sort();
    const imagesWithoutAlt = document.querySelectorAll("img:not([alt])").length;
    const unnamedControls = [...document.querySelectorAll("button, a[href], input, select, textarea")].filter((element) => {
      const label = element.getAttribute("aria-label") || element.getAttribute("aria-labelledby") || element.getAttribute("title");
      return !label && !element.textContent?.trim() && !element.querySelector("img")?.getAttribute("alt");
    }).length;
    return {duplicateIds, imagesWithoutAlt, unnamedControls, missingDocumentLanguage: !document.documentElement.lang, missingTitle: !document.title.trim()};
  });
}

export async function verifyUi({baseUrl, manifestPath, outputRoot, chromiumFactory} = {}) {
  const origin = validateBaseUrl(baseUrl || process.env.UI_VERIFY_BASE_URL || "");
  const manifest = validateManifest(JSON.parse(await readFile(manifestPath || resolve(ROOT, "verification/ui.json"), "utf8")));
  outputRoot = outputRoot || resolve(ROOT, ".git/ui-verification", manifest.project);
  const chromium = chromiumFactory || (await import("@playwright/test")).chromium;
  const browser = await chromium.launch();
  const evidence = {schemaVersion: 1, project: manifest.project, origin: origin.origin, result: "passed", cases: []};
  try {
    for (const {route, viewport} of expandCases(manifest)) {
      const context = await browser.newContext({viewport: {width: viewport.width, height: viewport.height}});
      const page = await context.newPage();
      const consoleErrors = [], pageErrors = [], failedRequests = [], serverErrors = [];
      page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("requestfailed", (request) => failedRequests.push({url: request.url(), error: request.failure()?.errorText || "failed"}));
      page.on("response", (response) => { if (response.status() >= 500) serverErrors.push({url: response.url(), status: response.status()}); });
      const response = await page.goto(new URL(route.path, origin).href, {waitUntil: "domcontentloaded", timeout: 30_000});
      await page.waitForTimeout(route.settleMilliseconds ?? 750);
      const accessibility = await audit(page);
      const screenshot = resolve(outputRoot, viewport.id, `${route.id}.png`);
      await mkdir(dirname(screenshot), {recursive: true});
      await page.screenshot({path: screenshot, fullPage: true});
      const allowed = (route.allowConsole || []).map((pattern) => new RegExp(pattern, "u"));
      const unexpectedConsole = consoleErrors.filter((message) => !allowed.some((pattern) => pattern.test(message)));
      const passed = response?.status() < 400 && !unexpectedConsole.length && !pageErrors.length && !failedRequests.length && !serverErrors.length && !accessibility.duplicateIds.length && accessibility.imagesWithoutAlt === 0 && accessibility.unnamedControls === 0 && !accessibility.missingDocumentLanguage && !accessibility.missingTitle;
      evidence.cases.push({route: route.id, viewport: viewport.id, status: response?.status() ?? null, result: passed ? "passed" : "failed", screenshot, consoleErrors: unexpectedConsole, pageErrors, failedRequests, serverErrors, accessibility});
      await context.close();
    }
  } finally {
    await browser.close();
  }
  if (evidence.cases.some((item) => item.result !== "passed")) evidence.result = "failed";
  await mkdir(outputRoot, {recursive: true});
  await writeFile(resolve(outputRoot, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, {mode: 0o600});
  return evidence;
}

function options(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index], value = argv[++index];
    if (!value) throw new Error(`${option} requires a value`);
    if (option === "--base-url") result.baseUrl = value;
    else if (option === "--manifest") result.manifestPath = resolve(ROOT, value);
    else if (option === "--output") result.outputRoot = resolve(ROOT, value);
    else throw new Error(`unknown option: ${option}`);
  }
  return result;
}

async function main() {
  try {
    const evidence = await verifyUi(options(process.argv.slice(2)));
    console.log(JSON.stringify(evidence, null, 2));
    if (evidence.result !== "passed") process.exitCode = 1;
  } catch (error) {
    console.log(JSON.stringify({result: "failed", error: error instanceof Error ? error.message : String(error)}, null, 2));
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
