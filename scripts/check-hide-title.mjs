// scripts/check-hide-title.mjs
import { createClient } from "next-sanity";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  token: process.env.SANITY_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

const pages = await client.fetch(`*[_type == "page"]{ _id, sections }`);
let found = 0;
for (const page of pages) {
  for (const section of page.sections ?? []) {
    if (section.hideTitle === true) {
      const title = section.title?.find((t) => t._key === "ja")?.value?.trim();
      if (title) {
        console.log(
          `Page ${page._id} | section ${section._key} (${section._type}): title="${title}"`,
        );
        found++;
      }
    }
  }
}
console.log(`\nTotal: ${found} section(s) with hideTitle:true AND non-empty title.`);
if (found > 0) {
  console.log("These titles will become VISIBLE on the frontend. Confirm before deploying.");
}
