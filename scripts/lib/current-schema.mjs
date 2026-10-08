import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { compileFunction } from "node:vm";
import ts from "typescript";
import { createSchema, validateDocument } from "sanity";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const requirePackage = createRequire(import.meta.url);
const uiOnly = new Proxy({}, { get: () => () => ({}) });
let cached;
let contentPolicy;
let validations = 0;
const timerWindow = { setTimeout, clearTimeout };

// Evaluate the checked-in schema and bilingual plugin configuration headlessly.
// Only presentation imports are stubbed; validation functions and schema imports
// execute unchanged. Unexpected dependencies fail rather than silently omitting rules.
export function currentSchema() {
  if (cached) return cached;
  const modules = new Map();
  function load(filename) {
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = { exports: {} };
    modules.set(filename, module);
    const code = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      fileName: filename,
    }).outputText;
    const localRequire = (specifier) => {
      if (["sanity", "sanity-plugin-internationalized-array"].includes(specifier)) return requirePackage(specifier);
      if (specifier === "@sanity/icons" || specifier === "@sanity/locale-ja-jp") return uiOnly;
      if (!specifier.startsWith(".")) throw new Error(`Unsupported headless schema dependency: ${specifier}`);
      let target = resolve(dirname(filename), specifier);
      if (target.startsWith(resolve(root, "sanity/components") + "/") || target.startsWith(resolve(root, "sanity/actions") + "/") || target === resolve(root, "sanity/lib/studioTheme") || target === resolve(root, "lib/portable-text-decorators")) return uiOnly;
      if (!(target.startsWith(resolve(root, "sanity/schemas") + "/") || target === resolve(root, "sanity/schemas") || target === resolve(root, "lib/announcement-fields") || target === resolve(root, "lib/content-policy"))) throw new Error(`Unsupported headless schema import: ${specifier}`);
      target = existsSync(`${target}.ts`) ? `${target}.ts` : resolve(target, "index.ts");
      return load(target);
    };
    compileFunction(code, ["require", "exports", "module", "process"], { filename })(localRequire, module.exports, module, { env: { NEXT_PUBLIC_SANITY_PROJECT_ID: "headless", NEXT_PUBLIC_SANITY_DATASET: "development" } });
    return module.exports;
  }
  const config = load(resolve(root, "sanity.config.ts")).default;
  contentPolicy = load(resolve(root, "lib/content-policy.ts"));
  const types = [...config.schema.types];
  for (const plugin of config.plugins) {
    if (plugin.schema?.types) {
      if (!Array.isArray(plugin.schema.types)) throw new Error("Unsupported functional plugin schema: update headless loading before writing.");
      types.push(...plugin.schema.types);
    }
  }
  cached = createSchema({ name: "yia-maintenance", types });
  return cached;
}

const systemFields = new Set(["_id", "_type", "_key", "_rev", "_createdAt", "_updatedAt", "_system", "_ref", "_weak", "_strengthenOnPublish"]);

export function structuralIssues(document, schema = currentSchema()) {
  const issues = [];
  const issue = (path, code) => issues.push({ path, code, level: "error" });
  function visit(value, type, path) {
    if (value === undefined || value === null) return;
    if (type.jsonType === "array") {
      if (!Array.isArray(value)) { issue(path, "expected-array"); return; }
      const keys = new Set();
      value.forEach((item, index) => {
        const childPath = [...path, index];
        const candidates = type.of ?? [];
        const child = typeof item === "object" && item !== null
          ? (item._type ? candidates.find((candidate) => candidate.name === item._type || candidate.type?.name === item._type) : candidates.length === 1 ? candidates[0] : undefined)
          : candidates.find((candidate) => candidate.jsonType === typeof item);
        if (!child) { issue(childPath, "unknown-array-type"); return; }
        if (item && typeof item === "object" && !Array.isArray(item)) {
          if (typeof item._key !== "string" || !item._key || keys.has(item._key)) issue(childPath, "missing-or-duplicate-key");
          if (type.name.startsWith("internationalizedArray") && !contentPolicy.studioLanguages.some(({ id }) => id === item._key)) issue(childPath, "unsupported-language-key");
          keys.add(item._key);
        }
        visit(item, child, childPath);
      });
    } else if (type.jsonType === "object") {
      if (!value || typeof value !== "object" || Array.isArray(value)) { issue(path, "expected-object"); return; }
      const fields = type.fields ?? [];
      for (const key of Object.keys(value)) {
        const field = fields.find((candidate) => candidate.name === key);
        if (field) visit(value[key], field.type, [...path, key]);
        else if (!systemFields.has(key)) issue([...path, key], "unknown-field");
      }
    } else if (typeof value !== type.jsonType || (type.jsonType === "number" && !Number.isFinite(value))) issue(path, `expected-${type.jsonType}`);
  }
  const type = schema.get(document?._type);
  if (!type || type.type?.name !== "document") issue([], "unknown-document-type");
  else visit(document, type, []);
  return issues;
}

export async function validateCurrentDocument(document, { client, documentIds } = {}) {
  const schema = currentSchema();
  const structural = structuralIssues(document, schema);
  if (structural.length) return structural;
  const workspace = {
    schema,
    getClient: () => {
      if (!client) throw new Error("This validation requires a read-only client.");
      return client;
    },
  };
  // Sanity's idle scheduler expects window timers even in its CLI environment.
  // Provide only that adapter, shared safely by overlapping validations.
  if (!validations && typeof globalThis.window === "undefined") globalThis.window = timerWindow;
  validations++;
  try {
    const markers = await validateDocument({
      document, workspace, environment: "cli",
      getDocumentExists: async ({ id }) => {
        if (documentIds) return documentIds.has(id);
        if (!client) throw new Error("Reference validation requires a read-only client or document ID inventory.");
        return client.fetch("count(*[_id == $id]) > 0", { id });
      },
    });
    return markers.map(({ path, level, message }) => ({ path, level, code: "schema-validation", message }));
  } finally {
    validations--;
    if (!validations && globalThis.window === timerWindow) delete globalThis.window;
  }
}

const publishedId = (id) => id.replace(/^drafts\./, "");

export function datasetIssues(documents) {
  const schema = currentSchema();
  const issues = [];
  // A draft and its published document are one logical identity. Inspect draft
  // values first so the audit catches collisions that the next publish would cause.
  const logical = new Map();
  for (const doc of documents) {
    if (!doc || typeof doc._id !== "string" || typeof doc._type !== "string") continue;
    const id = publishedId(doc._id);
    if (!logical.has(id) || doc._id.startsWith("drafts.")) logical.set(id, doc);
  }
  const groups = new Map();
  const issue = (doc, path, code) => issues.push({ id: doc._id, type: doc._type, path, code, level: "error" });
  for (const doc of logical.values()) {
    if (contentPolicy.singletonDocumentTypes.includes(doc._type)) {
      const key = `singleton:${doc._type}`;
      groups.set(key, [...(groups.get(key) ?? []), doc]);
    }
    const slugField = schema.get(doc._type)?.fields?.find(({ name }) => name === "slug");
    if (!slugField) continue;
    const slug = slugField.type.jsonType === "string" ? doc.slug : doc.slug?.current;
    if (typeof slug !== "string" || !slug || slug.trim() !== slug || /[/?#\s]/u.test(slug)) {
      issue(doc, ["slug"], "invalid-route-segment");
      continue;
    }
    // Page reads select by global slug before category routing; all pages must
    // be unique. Blog and announcement reads are scoped to document type.
    const id = publishedId(doc._id);
    const dash = id.indexOf("-");
    const aliases = doc._type === "page" ? new Set([slug, id, dash >= 0 ? id.slice(dash + 1) : id]) : new Set([slug]);
    for (const alias of aliases) {
      const key = `route:${doc._type}:${alias}`;
      groups.set(key, [...(groups.get(key) ?? []), doc]);
    }
  }
  for (const [key, docs] of groups) {
    if (docs.length < 2) continue;
    for (const doc of docs) issue(doc, key.startsWith("singleton:") ? ["_id"] : ["slug"], key.startsWith("singleton:") ? "duplicate-singleton" : "duplicate-route");
  }
  return issues;
}

export async function assertCurrentDocument(document, options = {}) {
  const issues = await validateCurrentDocument(document, options);
  if (!issues.some(({ level }) => level === "error")) {
    const type = currentSchema().get(document._type);
    const needsInventory = contentPolicy.singletonDocumentTypes.includes(document._type) || type?.fields?.some(({ name }) => name === "slug");
    if (needsInventory) {
      const inventory = options.documents ?? (options.client
        ? await options.client.fetch('*[_type == $type]{_id,_type,slug}', { type: document._type })
        : null);
      if (!Array.isArray(inventory)) throw new Error("Content identity validation requires a read-only document inventory before writing.");
      const others = inventory.filter(({ _id }) => publishedId(_id) !== publishedId(document._id));
      issues.push(...datasetIssues([...others, document]).filter(({ id }) => id === document._id));
    }
  }
  const errors = issues.filter((issue) => issue.level === "error");
  if (errors.length) {
    // Keep content and document values out of error output.
    throw new Error(`Current schema rejected ${document?._type ?? "document"}: ${errors.map((issue) => `${issue.path.join(".") || "document"} (${issue.code})`).join(", ")}`);
  }
  return document;
}
