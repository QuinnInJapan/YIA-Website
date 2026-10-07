# Agent Instructions

Before running commands, editing Sanity data, debugging deployment/cache behavior, or verifying UI changes, read and follow [docs/coding-agent-runbook.md](docs/coding-agent-runbook.md).

The runbook is the source of truth for:

- sandbox-safe command patterns and escalation behavior
- git staging/commit/push hygiene
- local Next.js, Playwright, build, and screenshot workflows
- Sanity script conventions and `scripts/lib/sanity-tools.mjs`
- Sanity revalidation vs code deployment responsibilities
- keeping these instructions updated when repo workflows change

When command workflows, Sanity conventions, Vercel/revalidation behavior, or test commands change, update the runbook in the same change.

## Analytics maintenance

For changes to public routes, Sanity templates, links, buttons, forms, translation,
or videos, follow the runbook's **Analytics changes during development** checklist
and [reporting contract](docs/google-analytics-reporting.md#keeping-analytics-aligned-with-development).
Review whether the change needs tracking, GA4 custom definitions, report filters,
or client-guide updates, and complete applicable updates in the same task. Record
account changes still requiring access explicitly; passing code tests is not proof
that Google reports were updated. New published Sanity pages inherit the public
layout; do not add per-page tags or a fixed list of tracked slugs.

This analytics setup must remain free-only and browser-only. Do not add telemetry
proxies, server-side cookie reads, timed cache refreshes, paid upgrades or Vercel
custom events. Preserve a single owner for page views and test new interactions
without collecting form answers or private URL values.
