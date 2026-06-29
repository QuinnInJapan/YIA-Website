import { logSummary, patchWithRevision, runSanityScript } from "./lib/sanity-tools.mjs";

runSanityScript({
  name: "Apply S-001 services category image removal",
  description:
    "Remove the 相談・サービス category hero image as the S-001 launch feedback resolution.",
  handler: async ({ client, dryRun }) => {
    const docs = await client.fetch(
      `*[_id in ["category-services", "drafts.category-services"]]{
        _id,
        _rev,
        heroImage
      }`,
    );

    let patched = 0;
    let skippedUnchanged = 0;
    const patchedDocs = [];

    for (const doc of docs ?? []) {
      if (!doc.heroImage?.asset?._ref) {
        skippedUnchanged += 1;
        continue;
      }

      await patchWithRevision(client, doc, { heroImage: null }, { dryRun });
      patched += 1;
      patchedDocs.push(doc._id);
    }

    logSummary({
      dryRun,
      found: docs?.length ?? 0,
      patched,
      skippedUnchanged,
      patchedDocs,
    });
  },
});
