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
