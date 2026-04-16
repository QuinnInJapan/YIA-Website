/**
 * Unset `caption` from all table sections in existing page documents.
 *
 * Usage: npx tsx scripts/migrate-remove-table-caption.ts
 *
 * Safe to re-run — skips documents where no table section has a caption.
 */
import { createClient } from "next-sanity";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_TOKEN;

if (!projectId || !dataset || !token) {
  console.error(
    "Missing required env vars: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_TOKEN",
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

async function main() {
  // Fetch published + draft page docs that have at least one table section with a caption
  const docs = await client.fetch<
    { _id: string; sections: { _type: string; caption?: unknown }[] }[]
  >(
    `*[_type == "page" && defined(sections[_type == "table" && defined(caption)][0])] { _id, sections }`,
  );

  if (docs.length === 0) {
    console.log("No documents with table captions found. Nothing to do.");
    return;
  }

  let patched = 0;
  for (const doc of docs) {
    const unsetPaths: string[] = [];
    (doc.sections ?? []).forEach((section, i) => {
      if (section._type === "table" && section.caption != null) {
        unsetPaths.push(`sections[${i}].caption`);
      }
    });
    if (unsetPaths.length > 0) {
      await client.patch(doc._id).unset(unsetPaths).commit();
      console.log(`  Patched ${doc._id} — unset ${unsetPaths.join(", ")}`);
      patched++;
    }
  }

  console.log(`\nDone. Patched ${patched} document(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
