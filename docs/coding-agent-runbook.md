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

For UI/page changes, use the registered Project Control service. It owns the stable development
endpoint at `http://127.0.0.1:4306` and launches Next.js with the webpack fallback because the
default Next/SWC development server can accept TCP connections without returning HTTP responses in
this project.

```bash
projectctl services yia-nextjs
projectctl start yia-nextjs web-next --checkout CHECKOUT_ID --wait
projectctl restart yia-nextjs web-next --checkout CHECKOUT_ID --run RUN_ID --wait
```

Use only the lifecycle action advertised by the current service response: `start` when stopped or
`restart` with the exact current run ID when running. Do not start a parallel raw development
server. Replace `CHECKOUT_ID` and `RUN_ID` with the exact returned values. If Project Control is
unavailable, run `projectctl doctor`; continue only with portless work
until coordination is restored. Run Playwright against the managed endpoint:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4306 \
  ./node_modules/.bin/playwright test e2e/program-pages.spec.ts --grep "conversation-salon"
```

Capture screenshots with Playwright when UI changes.

Use `npm run ui:verify -- --base-url http://127.0.0.1:4306` for the manifest-driven route and viewport sweep. It records screenshots plus bounded console, network, server-error, and accessibility evidence under `.git/ui-verification`.

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

Live writes to `production` require a second explicit confirmation:

```bash
node scripts/<task-specific-script>.mjs --live --allow-production
```

The template itself refuses `--live`; copy it first and replace the placeholder mutation.

Live scripts require `.env.local` with:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `SANITY_TOKEN`

Local development must use `NEXT_PUBLIC_SANITY_DATASET=development`. The Sanity CLI reads the same
`.env.local` values; do not hardcode a dataset in `sanity.cli.ts` or new maintenance scripts. Vercel
Production uses `production`; Vercel Preview and Development use `development`.

New mutation scripts should:

- default to dry-run
- require `--live` for writes/uploads
- use revision-guarded patches
- print loud failures with `ERROR`, `WHY`, `FIX`, and `CONTEXT`
- revalidate after live content mutations when user-visible pages changed

To refresh the disposable public development dataset from production, first preview the operation:

```bash
npm run sanity:sync-dev -- --dry-run
```

Then explicitly replace development. This exports production first and includes published documents,
drafts, images, and files. It never writes to production:

```bash
npm run sanity:sync-dev -- --live --reset-development
```

The sync uses Sanity export/import because direct cloud dataset cloning is unavailable on the Free
plan. If the import fails, the command reports and retains the temporary export for recovery. Existing
legacy migration scripts that hardcode `production` are historical and must not be reused; create a
new script from the maintained template instead.

Announcement mutation scripts must preserve the destination contract and call
`validateAnnouncementForMutation` before writing:

- `destinationType: "detail"` requires `slug.current` to contain only the URL suffix in lowercase
  letters, numbers, and hyphens; never store a full URL.
- `destinationType: "internalPage"` requires `targetPage` to be a published `page` reference. Body,
  image, excerpt, and attachments are not used for this destination type.
- `targetAnchor` is optional for internal-page announcements. Omit it to link to the page top; when
  present, copy a current `sec-...` id from that page's table of contents instead of inventing one.
- Missing `destinationType` is treated as `detail` for backward compatibility.

## Revalidation

### Credential rotation

Inventory production variable names without printing values. For webhook rotation,
deploy receiver support first with the existing primary secret unchanged. Then set
`SANITY_REVALIDATE_SECRET` to a cryptographically random replacement and set
`SANITY_REVALIDATE_SECRET_PREVIOUS` to the old value with an explicit ISO UTC
`SANITY_REVALIDATE_SECRET_PREVIOUS_UNTIL` deadline. Missing or invalid deadlines
disable the previous credential. Keep overlap short and complete the sender cutover
before the deadline; monitor delivery retries throughout it.

Vercel environment edits require a new deployment. Verify both credentials on the
production receiver using `{}` (authenticated, no cache invalidation), and verify
an invalid credential returns 401 before changing the existing Sanity webhook header.
Preserve the webhook identity, events, filter and projection. Read back its settings
without printing credentials, and verify real webhook delivery. Remove the previous
variables and deploy again after in-flight deliveries have drained; verify the old
credential now returns 401 and the new one 200. Never roll back to a deployment
containing only a retired credential; rebuild the reviewed rollback revision with
current credentials. A no-op authentication probe does not prove content invalidation.

Rotate provider API tokens by creating and verifying a replacement before updating
every consumer, then revoke the identified old token at the provider. Removing an
environment variable does not revoke a provider credential. Investigate unreferenced
variables and consumers before removal. Never log values, put them in command-line
arguments, or commit secret files.

Content-only Sanity changes should go live through webhook/revalidation. Code changes need commit, push, and deploy.

Public pages, the sitemap, and the Open Graph image use on-demand ISR only
(`revalidate = false`). All server-side Sanity queries must use
`sanityFetchOptions(...dependencyTags)` from `lib/sanity/revalidation.ts`: an
indefinite cache with specific dependency tags. `sanity:site-data` remains on
every query solely for an authenticated manual/emergency purge. Do not add a short route or fetch TTL: the lowest TTL can
reintroduce regeneration across routes sharing data.

The production Sanity webhook `YIA Next.js revalidation` POSTs to
`https://yia-nextjs.vercel.app/api/revalidate`. Keep it enabled for published
creates, updates, and deletes, excluding drafts. Its authentication must match
Vercel Production's `SANITY_REVALIDATE_SECRET`; never log the secret. The handler
expires affected dependency tags with `{ expire: 0 }`. Fetch tags invalidate
the dependent route output too; normal publishes do not call `revalidatePath`.
Regeneration happens when a route is next requested, not eagerly for every page.

Queries are split into settings, sidebar, navigation (titles/URLs only), homepage,
page details/summaries, announcement lists/details, blog lists/details/count/
related cards/adjacency, and metadata. A page body edit expires its own detail
keys. A title or slug change also expires navigation; renames and deletions cover
old and new keys and incoming announcement links. Blog count changes only on
create/delete. The social image has its own minimal query and only expires when
the homepage hero image or organization name/abbreviation changes.

The hook's `rule.projection` must use the versioned before/after snapshot in
`scripts/lib/sanity-webhook.mjs`. Keep snapshot fields aligned with the resolver
and test it with GROQ evaluation. Both null lifecycle values matter: `before:
null` means create and `after: null` means delete. Legacy single-document payloads
still work conservatively by invalidating their document type and dependencies.
Drafts, version documents, unknown types and invalid payloads are ignored.

After deploying the compatible handler, configure the existing hook through a
Sanity CLI session with webhook permissions, through the checkout's managed
command prefix. The script resolves the CLI from the working directory so it
uses the token injected by `--with-user-token`. Inspect the dry run first:

```bash
npx sanity exec scripts/configure-sanity-revalidation.cjs --with-user-token -- --dry-run
npx sanity exec scripts/configure-sanity-revalidation.cjs --with-user-token -- --live --allow-production
```

The script changes only the projection, preserving credentials, destination,
filters and all three publish events, and verifies by read-back. Add `--rollback`
to restore the prior projection if needed. It never changes Sanity content.
Manual refreshes should send complete `{schemaVersion: 1, before, after}`
documents. Explicit `{paths: [...]}` requests retain the old full data purge
contract for emergency maintenance; avoid them for normal edits.

There is no timed fallback. After live content scripts, verify webhook delivery
or POST the authenticated revalidation request yourself, then request affected
pages. A failed webhook must be fixed/retried before reporting content live.
Inspect recent deliveries with `sanity hook logs 'YIA Next.js revalidation'`
through the checkout's managed command prefix.

For ISR quota checks, use Vercel's team Usage dashboard, group ISR Writes by
project, and compare daily growth with the remaining allowance and reset date.
On-demand ISR reduces repeated regeneration but is not a hard quota cap: writes
can still occur on invalidation and cache misses. Do not repeatedly purge caches
or crawl every route to check usage. CLI billing/metrics may be unavailable on
Hobby; a failed API query is not evidence of zero usage.

Local revalidation requires `SANITY_REVALIDATE_SECRET` in the server environment:

```bash
curl -sS -X POST http://127.0.0.1:4306/api/revalidate \
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
