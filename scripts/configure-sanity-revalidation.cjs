// Run through "sanity exec ... --with-user-token -- --dry-run".
// The CLI session needs webhook administration permission; content tokens may
// not have it. This changes only the existing hook's projection, never content.
const { createRequire } = require("node:module");
const { resolve } = require("node:path");
// Use the CLI instance that sanity exec injected the session token into, even
// when this script is being reviewed from a different isolated worktree.
const { getCliClient } = createRequire(resolve(process.cwd(), "package.json"))("@sanity/cli");

(async () => {
  const { runSanityScript, assertLiveDatasetAllowed } = await import("./lib/sanity-tools.mjs");
  const { configureRevalidationWebhook } = await import("./lib/sanity-webhook.mjs");
  await runSanityScript({
    name: "Configure targeted Sanity revalidation",
    requireEnv: false,
    async handler({ live, allowProduction, args }) {
      assertLiveDatasetAllowed({ live, dataset: "production", allowProduction });
      const client = getCliClient({ apiVersion: "2024-01-01" });
      console.log(
        JSON.stringify(
          await configureRevalidationWebhook(client, {
            live,
            rollback: args.includes("--rollback"),
          }),
          null,
          2,
        ),
      );
    },
  });
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
