This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Local coding agents must use the registered Project Control service described in
`docs/coding-agent-runbook.md`; they must not run the following raw server commands. These commands
are retained only for isolated CI or human environments where Project Control is not installed:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

For local agent work, open the managed endpoint with `projectctl open yia-nextjs web-next`. In an
isolated human or CI environment using the raw commands above, open
[http://localhost:3000](http://localhost:3000).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Sanity Content Updates

Public Sanity-backed routes have a 60-second ISR fallback. For faster updates, configure a Sanity webhook to `POST /api/revalidate` with either `Authorization: Bearer <secret>` or an `x-sanity-revalidate-secret` header.

Set the same secret in Vercel as `SANITY_REVALIDATE_SECRET`. The webhook revalidates the exact affected paths when possible, and falls back to the shared site layout for global documents like navigation.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
