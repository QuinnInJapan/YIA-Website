# Coding Agent Runbook and Sanity Toolkit Design

## Context

Coding agents working in this repository repeatedly hit the same failure modes:

- Commands that work in a normal terminal need escalation or approved prefixes in the Codex sandbox.
- Local Next.js verification can be confused by generated `.next` route artifacts or missing revalidation secrets.
- Production builds can fail in restricted network contexts when `next/font` tries to fetch Google Fonts.
- Sanity scripts repeatedly reimplement environment loading, client creation, i18n helpers, section lookup, file upload, dry-run flags, and guarded patching.

The goal is to make the correct path obvious to future coding agents and to move repetitive Sanity mutation logic into deterministic helpers.

## Goals

- Add a concise runbook written for coding agents, not general contributors.
- Document the exact command contexts agents should prefer for local dev, tests, build, Sanity, Vercel, and git.
- Add a reusable Sanity scripting toolkit that reduces one-off script boilerplate.
- Add a copyable Sanity script template that demonstrates the expected pattern.
- Keep the first implementation small enough to review and maintain.

## Non-Goals

- Do not rewrite all existing Sanity migration scripts.
- Do not create a full CLI framework.
- Do not change production revalidation behavior.
- Do not solve sandbox policy itself; document how agents should work within it.

## Approach

Use the combined approach:

1. `docs/coding-agent-runbook.md`
   - A short operational runbook for agents.
   - Prioritizes commands, caveats, and decision rules over prose.

2. `scripts/lib/sanity-tools.mjs`
   - Shared deterministic helpers for Sanity scripts.
   - No hidden global mutation; each helper should be easy to understand and test manually.

3. `scripts/sanity-script-template.mjs`
   - A minimal template future agents can copy.
   - Demonstrates dry run, document fetch, section/row lookup, guarded patching, and summary logging.

4. Proof of use
   - Add the template as the first proof that the toolkit supports the intended scripting flow.
   - Do not refactor existing migration scripts in the first implementation pass.
   - Refactor existing scripts later only when they are already being modified for content work.

## Runbook Content

The runbook should cover:

- **Core rule:** prefer deterministic scripts and documented command forms over ad hoc shell work.
- **Git:** inspect status first, stage only intended files, never revert unrelated user changes.
- **Local dev:** use explicit host/port when needed: `./node_modules/.bin/next dev -H 127.0.0.1 -p 3000`.
- **Browser verification:** use Playwright against the local server; capture screenshots when UI changes.
- **Next cache:** if local route output is stale, prefer revalidation; if generated artifacts are stale, move route-specific artifacts to `/private/tmp` rather than deleting source or content.
- **Build:** `npm run build` may fail under restricted network because Google Fonts are fetched by `next/font`; record this as an environment limitation when it happens.
- **Tests:** run `npm run typecheck`, `node --test --experimental-strip-types tests/*.test.mjs`, and focused Playwright where applicable.
- **Sanity scripts:** load `.env.local`, default to `--dry-run`, use revision-guarded patches, and revalidate after live mutations.
- **Sanity content vs code deploys:** content-only mutations should go live through Sanity webhook/revalidation; code changes require commit/push/deploy.
- **Vercel CLI:** current CLI is outdated; recommend upgrading with `npm i -g vercel@latest` or `pnpm add -g vercel@latest`.

## Sanity Toolkit API

`scripts/lib/sanity-tools.mjs` should export:

- `loadSanityEnv(options?)`
  - Loads `.env.local` with `dotenv`.
  - Requires `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and `SANITY_TOKEN`.
  - Returns normalized env values.

- `createSanityClient(options?)`
  - Uses `@sanity/client`.
  - Defaults to `apiVersion: "2024-01-01"` and `useCdn: false`.

- `parseScriptFlags(argv?)`
  - Supports `--dry-run`, `--live`, and optional positional args.
  - Defaults to dry run unless `--live` is present.

- `i18n(jaValue, enValue)`, `cell(jaValue, enValue)`, `jaValue(field)`, `enValue(field)`
  - Standard bilingual field helpers.

- `findSection(doc, key, type?)`
  - Throws a clear error if a required section is absent or of the wrong type.

- `findRowByJaLabel(rows, label, options?)`
  - Finds label-table rows by Japanese label.

- `patchWithRevision(client, doc, set, options?)`
  - Uses `ifRevisionId` unless explicitly disabled.
  - In dry run, logs what would be patched and returns without writing.

- `commitOrPreview(operation, options?)`
  - Small generic helper for dry-run-aware mutation functions.

- `getOrUploadFileAsset(client, filePath, options?)`
  - Reuses an existing file asset by original filename when possible.
  - Uploads only in live mode.

- `logSummary(summary)`
  - Consistent end-of-script summary output.

## Error Handling

- Missing env vars should fail before any network request.
- Missing target documents, sections, rows, or assets should throw explicit errors.
- Live mutations should use revision guards by default.
- Dry runs should not upload files or patch documents.
- Scripts should exit nonzero on failure.

## Testing and Verification

After implementation:

- Run `npm run typecheck`.
- Run `node --test --experimental-strip-types tests/*.test.mjs`.
- Run a dry-run template invocation.
- If a script is refactored, run it in dry-run mode.
- Do not require network-only live Sanity mutation for verification unless explicitly requested.

## Implementation Scope

- The first implementation should include the runbook, toolkit, and template.
- Existing migration scripts should remain unchanged in this pass.
