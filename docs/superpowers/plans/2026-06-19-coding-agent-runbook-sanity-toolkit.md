# Coding Agent Runbook and Sanity Toolkit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a concise coding-agent runbook and a deterministic Sanity script toolkit/template that reduce sandbox, verification, and content-update mistakes.

**Architecture:** Keep operational guidance in one short markdown runbook. Put reusable Sanity script behavior in one ESM helper module, with a template showing the happy path. Add unit tests for deterministic helper behavior that does not require network access.

**Tech Stack:** Node.js ESM scripts, `@sanity/client`, `dotenv`, built-in `node:test`, Next.js App Router project commands.

**Status:** Executed in this branch. This file is retained as the historical implementation plan, not a pending task list.

## Global Constraints

- Do not rewrite existing Sanity migration scripts in this pass.
- New Sanity scripts should default to dry-run and require `--live` for writes.
- Failures must be loud and actionable with `ERROR`, `WHY`, `FIX`, and `CONTEXT`.
- Keep docs concise and optimized for coding agents.
- Preserve unrelated unstaged website/table changes.

---

### Task 1: Add Coding Agent Runbook

**Files:**

- Create: `docs/coding-agent-runbook.md`
- Modify: `docs/superpowers/specs/2026-06-19-coding-agent-runbook-sanity-toolkit-design.md`

**Interfaces:**

- Consumes: reviewed spec requirements and reviewer findings.
- Produces: a copy-paste runbook future agents can follow before running commands.

- [x] **Step 1: Write the runbook**

Create `docs/coding-agent-runbook.md` with:

````markdown
# Coding Agent Runbook

## Maintenance Contract

Update this file, `scripts/lib/sanity-tools.mjs`, and `scripts/sanity-script-template.mjs` in the same change when touching:

- `package.json` scripts or test commands
- Sanity schema, client config, env vars, or script conventions
- Vercel deploy, webhook, or revalidation behavior
- Playwright config or screenshot workflow
- command/escalation patterns that agents rely on

## Command Rules

- Run commands from repo root: `/Users/quinnngo/Desktop/projects/yia-nextjs`.
- Inspect `git status --short` before edits and before staging.
- Stage only intended files. Never revert unrelated user changes.
- If sandbox blocks a necessary command, rerun the same command with escalation instead of inventing a workaround.

## Standard Checks

```bash
npm run typecheck
node --test --experimental-strip-types tests/*.test.mjs
```
````

For UI/page changes:

```bash
./node_modules/.bin/next dev -H 127.0.0.1 -p 3000
./node_modules/.bin/playwright test e2e/program-pages.spec.ts --grep "conversation-salon"
```

## Build

```bash
npm run build
```

If this fails while fetching Google Fonts through `next/font`, report it as a restricted-network environment failure unless source errors are also present.

## Sanity Scripts

Use `scripts/lib/sanity-tools.mjs`. New scripts should use `runSanityScript`.

Dry run:

```bash
node scripts/sanity-script-template.mjs --dry-run
```

Live run:

```bash
node scripts/sanity-script-template.mjs --live
```

Live scripts require `.env.local` with `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and `SANITY_TOKEN`.

## Revalidation

Content-only Sanity changes should go live through webhook/revalidation. Code changes need commit/push/deploy.

Local revalidation requires `SANITY_REVALIDATE_SECRET` in the server environment:

```bash
curl -sS -X POST http://127.0.0.1:3000/api/revalidate \
  -H "content-type: application/json" \
  -H "x-sanity-revalidate-secret: $SANITY_REVALIDATE_SECRET" \
  --data '{"_type":"page","categoryRef":{"_ref":"category-classes"},"slug":{"current":"conversation-salon"}}'
```

## Stale Local Routes

Prefer revalidation first. If generated route artifacts are stale, move only route-specific `.next/server/app/...` artifacts to `/private/tmp` as backup. Do not delete source or Sanity content.

## Git

```bash
git status --short
git add <intended files only>
git commit -m "<type>: <summary>"
git push
```

## Vercel CLI

The installed Vercel CLI may be outdated. Recommend:

```bash
npm i -g vercel@latest
# or
pnpm add -g vercel@latest
```

````

- [x] **Step 2: Update the spec with reviewer findings**

Ensure the spec includes:

- maintenance contract
- `runSanityScript`
- standardized failure format
- deterministic file asset reuse
- toolkit unit tests

Expected: no `TODO`, `TBD`, or “Open Decisions” remain.

---

### Task 2: Add Sanity Toolkit and Tests

**Files:**
- Create: `scripts/lib/sanity-tools.mjs`
- Create: `tests/sanity-tools.test.mjs`

**Interfaces:**
- Produces:
  - `parseScriptFlags(argv?: string[]): { dryRun: boolean, live: boolean, args: string[] }`
  - `fail(message: string, details?: { cause?: unknown, fix?: string, context?: unknown }): SanityScriptError`
  - `formatFailure(error: unknown): string`
  - `i18n(jaValue: string, enValue?: string): Array<{ _key: string, value: string }>`
  - `cell(jaValue: string, enValue?: string): Array<{ _key: string, value: string }>`
  - `patchWithRevision(client, doc, set, options): Promise<unknown>`
  - `runSanityScript(config): Promise<void>`

- [x] **Step 1: Write tests first**

Create `tests/sanity-tools.test.mjs` covering:

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  cell,
  fail,
  formatFailure,
  i18n,
  loadSanityEnv,
  parseScriptFlags,
  patchWithRevision,
} from "../scripts/lib/sanity-tools.mjs";

test("parseScriptFlags defaults to dry-run", () => {
  assert.deepEqual(parseScriptFlags([]), { dryRun: true, live: false, args: [] });
});

test("parseScriptFlags requires --live for live mode", () => {
  assert.deepEqual(parseScriptFlags(["--live", "page-id"]), {
    dryRun: false,
    live: true,
    args: ["page-id"],
  });
});

test("parseScriptFlags rejects conflicting modes", () => {
  assert.throws(() => parseScriptFlags(["--dry-run", "--live"]), /Choose either --dry-run or --live/);
});

test("i18n and cell create standard bilingual arrays", () => {
  assert.deepEqual(i18n("日本語", "English"), [
    { _key: "ja", value: "日本語" },
    { _key: "en", value: "English" },
  ]);
  assert.deepEqual(cell("10:00", "10:00"), i18n("10:00", "10:00"));
});

test("loadSanityEnv fails loudly when env is missing", () => {
  assert.throws(
    () => loadSanityEnv({ env: {}, envPath: "/tmp/does-not-matter.env", loadDotenv: false }),
    /Missing required Sanity environment variables/,
  );
});

test("formatFailure prints loud actionable sections", () => {
  const error = fail("Missing page", { fix: "Check the page id", context: { id: "page-x" } });
  const formatted = formatFailure(error);
  assert.match(formatted, /ERROR/);
  assert.match(formatted, /WHY/);
  assert.match(formatted, /FIX/);
  assert.match(formatted, /CONTEXT/);
});

test("patchWithRevision prevents writes in dry-run mode", async () => {
  let called = false;
  const client = {
    patch() {
      called = true;
      throw new Error("should not write");
    },
  };

  const result = await patchWithRevision(
    client,
    { _id: "page-test", _rev: "rev-1" },
    { title: "new" },
    { dryRun: true },
  );

  assert.equal(called, false);
  assert.equal(result.dryRun, true);
});
````

- [x] **Step 2: Run tests to verify failure**

Run:

```bash
node --test --experimental-strip-types tests/sanity-tools.test.mjs
```

Expected: fail because `scripts/lib/sanity-tools.mjs` does not exist.

- [x] **Step 3: Implement `scripts/lib/sanity-tools.mjs`**

Implement the exports described above plus:

- `createSanityClient(options?)`
- `jaValue(field)`
- `enValue(field)`
- `findSection(doc, key, type?)`
- `findRowByJaLabel(rows, label, options?)`
- `commitOrPreview(operation, options?)`
- `getOrUploadFileAsset(client, filePath, options?)`
- `logSummary(summary)`

Key behaviors:

- `parseScriptFlags` defaults to dry run.
- `fail` creates a named error object.
- `formatFailure` prints `ERROR`, `WHY`, `FIX`, `CONTEXT`.
- `runSanityScript` catches errors, prints formatted failure, and sets `process.exitCode = 1`.
- `getOrUploadFileAsset` validates local path in all modes and rejects ambiguous filename matches unless size or sha1 matches.

- [x] **Step 4: Run toolkit tests**

Run:

```bash
node --test --experimental-strip-types tests/sanity-tools.test.mjs
```

Expected: pass.

---

### Task 3: Add Sanity Script Template

**Files:**

- Create: `scripts/sanity-script-template.mjs`

**Interfaces:**

- Consumes: `runSanityScript`, `findSection`, `findRowByJaLabel`, `patchWithRevision`, `i18n`.
- Produces: a copyable template with dry-run/live behavior and loud failure.

- [x] **Step 1: Create the template**

Create a script that:

- imports from `scripts/lib/sanity-tools.mjs`
- calls `runSanityScript`
- fetches one page by `--page-id <id>` or defaults to a harmless expected id in dry-run
- demonstrates section and row lookup
- calls `patchWithRevision(..., { dryRun })`
- logs a summary

- [x] **Step 2: Smoke check template help/dry run**

Run:

```bash
node scripts/sanity-script-template.mjs --dry-run --page-id page-kaiwasalon
```

Expected: either a dry-run summary if env/network are available, or a loud standardized env/network failure. It must not silently write.

---

### Task 4: Verify and Commit

**Files:**

- Verify all files from Tasks 1-3.

**Interfaces:**

- Produces: committed implementation ready to push.

- [x] **Step 1: Format changed files**

Run:

```bash
./node_modules/.bin/prettier --write docs/coding-agent-runbook.md docs/superpowers/specs/2026-06-19-coding-agent-runbook-sanity-toolkit-design.md docs/superpowers/plans/2026-06-19-coding-agent-runbook-sanity-toolkit.md scripts/lib/sanity-tools.mjs scripts/sanity-script-template.mjs tests/sanity-tools.test.mjs
```

- [x] **Step 2: Run checks**

Run:

```bash
npm run typecheck
node --test --experimental-strip-types tests/*.test.mjs
```

Expected: pass.

- [x] **Step 3: Inspect status**

Run:

```bash
git status --short
```

Expected: implementation files changed, plus unrelated existing website/table work remains unstaged.

- [x] **Step 4: Commit implementation files only**

Run:

```bash
git add docs/coding-agent-runbook.md docs/superpowers/specs/2026-06-19-coding-agent-runbook-sanity-toolkit-design.md docs/superpowers/plans/2026-06-19-coding-agent-runbook-sanity-toolkit.md scripts/lib/sanity-tools.mjs scripts/sanity-script-template.mjs tests/sanity-tools.test.mjs
git commit -m "chore: add agent runbook and sanity toolkit"
```

- [x] **Step 5: Push**

Run:

```bash
git push
```
