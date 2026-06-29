# Coding Agent Runbook

This file is for coding agents working in this repo. Prefer these commands and helpers over ad hoc shell work.

## Maintenance Contract

Update this file, `scripts/lib/sanity-tools.mjs`, and `scripts/sanity-script-template.mjs` in the same change when touching:

- `package.json` scripts or test commands
- Sanity schema, client config, environment variables, or script conventions
- Vercel deploy, webhook, or revalidation behavior
- Playwright config or screenshot workflow
- command/escalation patterns that agents rely on

## Command Rules

- Run commands from repo root: `/Users/quinnngo/Desktop/projects/yia-nextjs`.
- Inspect `git status --short` before edits and before staging.
- Stage only intended files. Never revert unrelated user changes.
- If sandboxing blocks a necessary command, rerun the same command with escalation instead of inventing a workaround.
- For file edits, use `apply_patch`; do not generate source files through shell redirection.

## Standard Checks

```bash
npm test
```

For UI/page changes:

```bash
./node_modules/.bin/next dev -H 127.0.0.1 -p 3000
./node_modules/.bin/playwright test e2e/program-pages.spec.ts --grep "conversation-salon"
```

Capture screenshots with Playwright when UI changes.

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

Live run for a task-specific script:

```bash
node scripts/<task-specific-script>.mjs --live
```

The template itself refuses `--live`; copy it first and replace the placeholder mutation.

Live scripts require `.env.local` with:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `SANITY_TOKEN`

New mutation scripts should:

- default to dry-run
- require `--live` for writes/uploads
- use revision-guarded patches
- print loud failures with `ERROR`, `WHY`, `FIX`, and `CONTEXT`
- revalidate after live content mutations when user-visible pages changed

## Revalidation

Content-only Sanity changes should go live through webhook/revalidation. Code changes need commit, push, and deploy.

Local revalidation requires `SANITY_REVALIDATE_SECRET` in the server environment:

```bash
curl -sS -X POST http://127.0.0.1:3000/api/revalidate \
  -H "content-type: application/json" \
  -H "x-sanity-revalidate-secret: $SANITY_REVALIDATE_SECRET" \
  --data '{"_type":"page","categoryRef":{"_ref":"category-classes"},"slug":{"current":"conversation-salon"}}'
```

## Stale Local Routes

Prefer revalidation first. If generated route artifacts are stale, move only route-specific `.next/server/app/...` artifacts to `/private/tmp` as a backup. Do not delete source or Sanity content.

## Git

```bash
git status --short
git add <intended files only>
git commit -m "<type>: <summary>"
git push
```

Keep unrelated dirty files unstaged unless the user explicitly asks to include them.

## Vercel CLI

The installed Vercel CLI is outdated. Recommend upgrading for best compatibility and newer agentic features:

```bash
npm i -g vercel@latest
# or
pnpm add -g vercel@latest
```
