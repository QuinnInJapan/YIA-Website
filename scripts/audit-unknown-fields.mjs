#!/usr/bin/env node
import { runSanityScript } from "./lib/sanity-tools.mjs";
import { structuralIssues } from "./lib/current-schema.mjs";

await runSanityScript({
  name: "Current-schema field audit",
  description: "Read-only nested field/type checks, including drafts and current section types.",
  async handler({ client }) {
    const documents = await client.fetch('*[!(_type match "system.*") && !(_id in path("_.**"))]');
    let count = 0;
    for (const document of documents) {
      if (document._type.startsWith("sanity.") || document._type.startsWith("translation.")) continue;
      for (const issue of structuralIssues(document)) {
        console.log(JSON.stringify({ id: document._id, type: document._type, path: issue.path, code: issue.code }));
        count++;
      }
    }
    console.log(`Checked ${documents.length} documents; ${count} structural issues. No writes performed.`);
    if (count) process.exitCode = 1;
  },
});
