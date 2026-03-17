/**
 * Migrate existing announcements to the new schema:
 * - Rename `content` → `body`
 * - Rename `image` → `heroImage` (with hotspot support)
 * - Generate `slug` from English or Japanese title
 *
 * Run: npx tsx scripts/migrate-announcements.ts
 * Requires SANITY_TOKEN in .env.local
 */

import { createClient } from "@sanity/client";

// Load env
const envLine = (key: string) => {
  const fs = require("fs");
  const content = fs.readFileSync(".env.local", "utf-8");
  const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match?.[1]?.trim() ?? "";
};

const client = createClient({
  projectId: envLine("NEXT_PUBLIC_SANITY_PROJECT_ID"),
  dataset: envLine("NEXT_PUBLIC_SANITY_DATASET"),
  token: envLine("SANITY_TOKEN"),
  apiVersion: "2024-01-01",
  useCdn: false,
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[&/\\#,+()$~%.'":*?<>{}!@^=;`[\]|]/g, "")
    .slice(0, 96);
}

async function migrate() {
  const announcements = await client.fetch<
    {
      _id: string;
      title?: { _key: string; value: string }[];
      content?: unknown;
      image?: unknown;
      slug?: { current: string };
      body?: unknown;
      heroImage?: unknown;
    }[]
  >(`*[_type == "announcement"]{ _id, title, content, image, slug, body, heroImage }`);

  console.log(`Found ${announcements.length} announcements to migrate`);

  const existingSlugs = new Set<string>();
  let migrated = 0;

  for (const ann of announcements) {
    const patch: Record<string, unknown> = {};
    const unset: string[] = [];

    // Rename content → body (only if body doesn't already exist)
    if (ann.content && !ann.body) {
      patch.body = ann.content;
      unset.push("content");
    }

    // Rename image → heroImage (only if heroImage doesn't already exist)
    if (ann.image && !ann.heroImage) {
      patch.heroImage = ann.image;
      unset.push("image");
    }

    // Generate slug if missing
    if (!ann.slug?.current) {
      const enTitle = ann.title?.find((t) => t._key === "en")?.value;
      const jaTitle = ann.title?.find((t) => t._key === "ja")?.value;
      let base = slugify(enTitle || jaTitle || ann._id);

      // Ensure uniqueness
      let slug = base;
      let counter = 1;
      while (existingSlugs.has(slug)) {
        slug = `${base}-${counter}`;
        counter++;
      }
      existingSlugs.add(slug);
      patch.slug = { _type: "slug", current: slug };
    } else {
      existingSlugs.add(ann.slug.current);
    }

    if (Object.keys(patch).length > 0 || unset.length > 0) {
      let tx = client.patch(ann._id);
      if (Object.keys(patch).length > 0) tx = tx.set(patch);
      if (unset.length > 0) tx = tx.unset(unset);
      await tx.commit();
      migrated++;

      const title = ann.title?.find((t) => t._key === "ja")?.value ?? ann._id;
      console.log(
        `  ✓ ${title} → slug: ${(patch.slug as { current: string })?.current ?? ann.slug?.current}`,
      );
    }
  }

  console.log(`\nMigrated ${migrated}/${announcements.length} announcements`);
}

migrate().catch(console.error);
