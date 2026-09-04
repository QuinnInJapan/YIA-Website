#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fail, runSanityScript } from "./lib/sanity-tools.mjs";

const SOURCE_DATASET = "production";
const TARGET_DATASET = "development";
const RESET_FLAG = "--reset-development";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sanityExecutable = path.join(repoRoot, "node_modules", ".bin", "sanity");

function runSanityCli(args, { capture = false } = {}) {
  const result = spawnSync(sanityExecutable, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NO_UPDATE_NOTIFIER: "1" },
    stdio: capture ? "pipe" : "inherit",
  });

  if (result.error || result.status !== 0) {
    throw fail(`Sanity CLI failed: sanity ${args.join(" ")}`, {
      cause: result.error ?? new Error(result.stderr?.trim() || `Exit status ${result.status}`),
      fix: "Confirm the Sanity CLI is logged in, the token/account can manage datasets, and network access is available, then rerun the same command.",
      context: { args, status: result.status },
    });
  }

  return capture ? result.stdout : "";
}

function datasetExists(name) {
  const output = runSanityCli(["dataset", "list"], { capture: true });
  const plainOutput = output.replace(/\u001b\[[0-9;]*m/g, "");
  return plainOutput
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .includes(name);
}

await runSanityScript({
  name: "Production → development dataset refresh",
  description:
    "Exports production, recreates the public development dataset, and imports the export into it.",
  async handler({ dryRun, args, env }) {
    const resetDevelopment = args.includes(RESET_FLAG);
    const unknownArgs = args.filter((arg) => arg !== RESET_FLAG);

    if (unknownArgs.length > 0) {
      throw fail("Unknown production-to-development sync arguments.", {
        fix: `Use --dry-run, or use --live ${RESET_FLAG} to replace development.`,
        context: { unknownArgs },
      });
    }

    if (env.dataset !== TARGET_DATASET) {
      throw fail("The local Sanity environment must point to development before syncing.", {
        fix: `Set NEXT_PUBLIC_SANITY_DATASET=${TARGET_DATASET} in .env.local, then rerun.`,
        context: { configuredDataset: env.dataset, requiredDataset: TARGET_DATASET },
      });
    }

    console.log(`Source: ${SOURCE_DATASET} (read only)`);
    console.log(`Target: ${TARGET_DATASET} (replaced)`);
    console.log("Includes: published documents, drafts, images, and files");

    if (dryRun) {
      console.log("");
      console.log(`No changes made. Run with --live ${RESET_FLAG} to perform the refresh.`);
      return;
    }

    if (!resetDevelopment) {
      throw fail("Replacing the development dataset requires explicit confirmation.", {
        fix: `Rerun with --live ${RESET_FLAG}. Production remains read-only.`,
        context: { source: SOURCE_DATASET, target: TARGET_DATASET },
      });
    }

    const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), "yia-sanity-sync-"));
    const exportPath = path.join(temporaryDirectory, `${SOURCE_DATASET}.tar.gz`);
    let completed = false;

    try {
      console.log("\n1/4 Exporting production...");
      runSanityCli(["dataset", "export", SOURCE_DATASET, exportPath, "--overwrite"]);

      console.log("\n2/4 Resetting development...");
      if (datasetExists(TARGET_DATASET)) {
        runSanityCli(["dataset", "delete", TARGET_DATASET, "--force"]);
      }
      runSanityCli(["dataset", "create", TARGET_DATASET, "--visibility", "public"]);

      console.log("\n3/4 Importing production data into development...");
      runSanityCli(["dataset", "import", exportPath, TARGET_DATASET, "--replace"]);

      console.log("\n4/4 Refresh complete.");
      completed = true;
    } finally {
      if (completed) {
        rmSync(temporaryDirectory, { recursive: true, force: true });
      } else {
        console.error(`Temporary export retained for recovery: ${exportPath}`);
      }
    }
  },
});
