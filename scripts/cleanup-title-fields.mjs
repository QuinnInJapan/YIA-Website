/**
 * Cleanup: Rename orphaned `title` fields to `label` on documentLink items,
 * and remove any other stale `title` fields left from the linkItem → documentLink migration.
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/cleanup-title-fields.mjs
 */

import { createClient } from "next-sanity";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

async function main() {
  // Links sections in pages
  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      sections[_type == "links"]{ _key, items }
    }[count(sections) > 0]`
  );

  let count = 0;

  for (const page of pages) {
    for (const section of page.sections) {
      if (!section.items || section.items.length === 0) continue;
      const hasOrphan = section.items.some((it) => it.title);
      if (!hasOrphan) continue;

      const updated = section.items.map((it) => {
        if (!it.title) return it;
        const { title, ...rest } = it;
        // Keep label if already set, otherwise use title
        return { ...rest, label: rest.label || title };
      });

      console.log(`Patching ${page._id}, section ${section._key}: ${updated.length} items`);
      await client
        .patch(page._id)
        .set({ [`sections[_key=="${section._key}"].items`]: updated })
        .commit();
      count++;
    }
  }

  // Documents on announcements
  const announcements = await client.fetch(
    `*[_type == "announcement" && defined(documents)]{ _id, documents }`
  );

  for (const ann of announcements) {
    if (!ann.documents || ann.documents.length === 0) continue;
    const hasOrphan = ann.documents.some((d) => d.title);
    if (!hasOrphan) continue;

    const updated = ann.documents.map((d) => {
      if (!d.title) return d;
      const { title, ...rest } = d;
      return { ...rest, label: rest.label || title };
    });

    console.log(`Patching ${ann._id}: ${updated.length} docs`);
    await client.patch(ann._id).set({ documents: updated }).commit();
    count++;
  }

  // Sidebar documents
  const sidebar = await client.fetch(`*[_type == "sidebar"][0]{ _id, documents }`);
  if (sidebar?.documents?.some((d) => d.title)) {
    const updated = sidebar.documents.map((d) => {
      if (!d.title) return d;
      const { title, ...rest } = d;
      return { ...rest, label: rest.label || title };
    });
    console.log(`Patching sidebar: ${updated.length} docs`);
    await client.patch(sidebar._id).set({ documents: updated }).commit();
    count++;
  }

  console.log(`\nDone. Patched ${count} location(s).`);
}

main().catch(console.error);
