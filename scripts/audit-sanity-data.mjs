#!/usr/bin/env node
import { runSanityScript } from "./lib/sanity-tools.mjs";
import { validateCurrentDocument } from "./lib/current-schema.mjs";

await runSanityScript({
  name: "Current-schema content audit",
  description: "Read-only validation of published documents and drafts against checked-in Studio schemas.",
  async handler({ client }) {
    const documents = await client.fetch('*[!(_type match "system.*") && !(_id in path("_.**"))]');
    const documentIds = new Set(documents.map((document) => document._id));
    let count = 0;
    for (const document of documents) {
      if (document._type.startsWith("sanity.") || document._type.startsWith("translation.")) continue;
      for (const issue of await validateCurrentDocument(document, { client, documentIds })) {
        console.log(JSON.stringify({ id: document._id, type: document._type, level: issue.level, path: issue.path, code: issue.code }));
        count++;
      }
    }
    console.log(`Checked ${documents.length} documents; ${count} issues. No writes performed.`);
    if (count) process.exitCode = 1;
  },
});
