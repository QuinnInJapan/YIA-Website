import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import dotenv from "dotenv";
import { createClient } from "@sanity/client";

const DEFAULT_API_VERSION = "2024-01-01";
const REQUIRED_ENV = [
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  "NEXT_PUBLIC_SANITY_DATASET",
  "SANITY_TOKEN",
];

export class SanityScriptError extends Error {
  constructor(message, { cause, fix, context } = {}) {
    super(message);
    this.name = "SanityScriptError";
    this.cause = cause;
    this.fix = fix;
    this.context = context;
  }
}

export function fail(message, details = {}) {
  return new SanityScriptError(message, details);
}

export function formatFailure(error) {
  const scriptError =
    error instanceof SanityScriptError
      ? error
      : fail(error?.message ?? "Unknown Sanity script failure", {
          cause: error,
          fix: "Check the command context, required environment variables, local files, and network access; rerun with escalation only when the same command requires it.",
          context:
            error instanceof Error
              ? { name: error.name, message: error.message, code: error.code }
              : { error },
        });

  const lines = [
    "ERROR",
    `  ${scriptError.message}`,
    "",
    "WHY",
    `  ${causeText(scriptError.cause)}`,
  ];

  if (scriptError.fix) {
    lines.push("", "FIX", `  ${scriptError.fix}`);
  }

  if (scriptError.context !== undefined) {
    lines.push("", "CONTEXT", indent(formatContext(scriptError.context), "  "));
  }

  return lines.join("\n");
}

export function parseScriptFlags(argv = process.argv.slice(2)) {
  const dryRun = argv.includes("--dry-run");
  const live = argv.includes("--live");

  if (dryRun && live) {
    throw fail("Choose either --dry-run or --live, not both.", {
      fix: "Run the script again with one mode flag. Omit both flags to default to --dry-run.",
      context: { argv },
    });
  }

  return {
    dryRun: !live,
    live,
    args: argv.filter((arg) => arg !== "--dry-run" && arg !== "--live"),
  };
}

export function loadSanityEnv({
  env = process.env,
  envPath = ".env.local",
  loadDotenv = true,
  required = REQUIRED_ENV,
} = {}) {
  if (loadDotenv) {
    dotenv.config({ path: envPath, quiet: true });
  }

  const source = env === process.env ? process.env : env;
  const missing = required.filter((key) => !source[key]);
  if (missing.length) {
    throw fail("Missing required Sanity environment variables.", {
      fix: `Set ${missing.join(", ")} in ${envPath} or the command environment.`,
      context: { missing, envPath },
    });
  }

  return {
    projectId: source.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: source.NEXT_PUBLIC_SANITY_DATASET,
    token: source.SANITY_TOKEN,
  };
}

export function createSanityClient(options = {}) {
  const env = options.envValues ?? loadSanityEnv(options);
  return createClient({
    projectId: env.projectId,
    dataset: env.dataset,
    token: env.token,
    apiVersion: options.apiVersion ?? DEFAULT_API_VERSION,
    useCdn: false,
  });
}

export async function runSanityScript({ name, description, requireEnv = true, handler }) {
  try {
    const flags = parseScriptFlags();
    const modeLabel = flags.dryRun ? "DRY RUN" : "LIVE";

    if (!handler) {
      throw fail("Sanity script is missing a handler.", {
        fix: "Pass runSanityScript({ name, handler }) from the script entrypoint.",
        context: { name },
      });
    }

    const env = requireEnv ? loadSanityEnv() : null;
    const client = requireEnv ? createSanityClient({ envValues: env }) : null;

    console.log(`${name ?? "Sanity script"} (${modeLabel})`);
    if (description) console.log(description);
    console.log("");

    await handler({ ...flags, client, env, modeLabel });
  } catch (error) {
    console.error(formatFailure(error));
    process.exitCode = 1;
  }
}

export function i18n(jaValue, enValue = "") {
  return [
    { _key: "ja", value: jaValue ?? "" },
    { _key: "en", value: enValue ?? "" },
  ];
}

export function cell(jaValue, enValue = "") {
  return i18n(jaValue, enValue);
}

export function jaValue(field) {
  return field?.find((entry) => entry._key === "ja")?.value ?? "";
}

export function enValue(field) {
  return field?.find((entry) => entry._key === "en")?.value ?? "";
}

export function findSection(doc, key, type) {
  const section = doc?.sections?.find((item) => item._key === key);
  if (!section) {
    throw fail("Missing required Sanity section.", {
      fix: "Check the section key against the current Sanity document before patching.",
      context: { docId: doc?._id, key, expectedType: type },
    });
  }
  if (type && section._type !== type) {
    throw fail("Sanity section has the wrong type.", {
      fix: "Update the script target or migrate the document shape first.",
      context: { docId: doc?._id, key, expectedType: type, actualType: section._type },
    });
  }
  return section;
}

export function findRowByJaLabel(rows, label, { required = true } = {}) {
  const row = rows?.find((item) => jaValue(item.label) === label);
  if (!row && required) {
    throw fail("Missing required row by Japanese label.", {
      fix: "Check the label text or update the script to match the current Sanity data.",
      context: { label },
    });
  }
  return row;
}

export async function patchWithRevision(
  client,
  doc,
  set,
  { dryRun = true, useRevision = true } = {},
) {
  if (!doc?._id) {
    throw fail("Cannot patch a Sanity document without _id.", {
      fix: "Fetch the target document with _id and _rev before patching.",
      context: { doc },
    });
  }

  if (useRevision && !doc._rev) {
    throw fail("Cannot revision-guard a Sanity patch without _rev.", {
      fix: "Fetch the target document with _rev or pass { useRevision: false } explicitly.",
      context: { docId: doc._id },
    });
  }

  if (dryRun) {
    console.log(`[dry-run] Would patch ${doc._id}`);
    return { dryRun: true, docId: doc._id, set };
  }

  let patch = client.patch(doc._id);
  if (useRevision) patch = patch.ifRevisionId(doc._rev);
  return patch.set(set).commit();
}

export async function commitOrPreview(operation, { dryRun = true, label = "operation" } = {}) {
  if (dryRun) {
    console.log(`[dry-run] Would run ${label}`);
    return { dryRun: true, label };
  }
  return operation();
}

export async function getOrUploadFileAsset(
  client,
  filePath,
  { dryRun = true, filename = path.basename(filePath), contentType } = {},
) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw fail("Local file for Sanity upload was not found.", {
      fix: "Pass a valid file path before running the script.",
      context: { filePath },
    });
  }

  const stat = fs.statSync(filePath);
  const sha1 = sha1File(filePath);
  const existing = await client.fetch(
    `*[_type == "sanity.fileAsset" && originalFilename == $filename]{
      _id,
      originalFilename,
      size,
      sha1hash,
      url
    }`,
    { filename },
  );

  const deterministic = (existing ?? []).filter(
    (asset) => asset.sha1hash === sha1 || asset.size === stat.size,
  );

  if (deterministic.length === 1) {
    console.log(`Using existing file asset: ${deterministic[0]._id}`);
    return deterministic[0];
  }

  if ((existing ?? []).length > 0 && deterministic.length !== 1) {
    throw fail("Ambiguous Sanity file asset match.", {
      fix: "Use a unique filename or remove stale duplicate assets before reusing by filename.",
      context: {
        filename,
        localSize: stat.size,
        localSha1: sha1,
        matches: existing.map((asset) => ({
          _id: asset._id,
          size: asset.size,
          sha1hash: asset.sha1hash,
        })),
      },
    });
  }

  if (dryRun) {
    console.log(`[dry-run] Would upload file asset: ${filename}`);
    return { dryRun: true, filename, size: stat.size, sha1hash: sha1 };
  }

  return client.assets.upload("file", fs.createReadStream(filePath), {
    filename,
    contentType,
  });
}

export function logSummary(summary) {
  console.log("");
  console.log("SUMMARY");
  for (const [key, value] of Object.entries(summary ?? {})) {
    console.log(`  ${key}: ${formatSummaryValue(value)}`);
  }
}

function causeText(cause) {
  if (!cause) return "The script detected an invalid or unsafe state before continuing.";
  if (cause instanceof Error) return cause.message;
  return String(cause);
}

function formatContext(context) {
  if (typeof context === "string") return context;
  return JSON.stringify(context, null, 2);
}

function indent(value, prefix) {
  return String(value)
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

function sha1File(filePath) {
  return crypto.createHash("sha1").update(fs.readFileSync(filePath)).digest("hex");
}

function formatSummaryValue(value) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}
