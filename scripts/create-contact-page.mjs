/**
 * Migration: Create a Sanity page document for "Contact" and add it to navigation
 *
 * 1. Create page document (page-contact) with slug, title, description, categoryRef
 * 2. Append it to the "about" category in the navigation document
 *
 * This replaces the hardcoded contact entry in lib/data.ts so the contact page
 * is fully data-driven like every other page.
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/create-contact-page.mjs
 *
 * Add --dry-run to preview without writing.
 */

import { createClient } from "next-sanity";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

const DRY_RUN = process.argv.includes("--dry-run");

async function migrate() {
  console.log(DRY_RUN ? "\n[DRY RUN MODE]\n" : "\n[LIVE MODE]\n");

  // ── 1. Check if contact page already exists ─────────────────────
  const existing = await client.fetch(`*[_id == "page-contact"][0]`);
  if (existing) {
    console.log("page-contact already exists — skipping creation.");
  } else {
    console.log("=== 1. Create page-contact document ===");
    const doc = {
      _id: "page-contact",
      _type: "page",
      slug: "contact",
      categoryRef: { _type: "reference", _ref: "category-about" },
      title: [
        { _key: "ja", value: "お問い合わせ" },
        { _key: "en", value: "Contact" },
      ],
      description: [
        { _key: "ja", value: "お気軽にお問い合わせください。" },
        { _key: "en", value: "Feel free to contact us." },
      ],
      template: "contact",
      sections: [],
    };
    console.log("  _id:", doc._id);
    console.log("  slug:", doc.slug);
    console.log("  title:", doc.title.map((t) => `${t._key}: ${t.value}`).join(", "));
    console.log("  template: contact");

    if (!DRY_RUN) {
      await client.createOrReplace(doc);
      console.log("  Created.");
    }
  }

  // ── 2. Add to navigation ────────────────────────────────────────
  const nav = await client.fetch(
    `*[_type == "navigation"][0]{
      _id,
      categories[]{
        _key,
        categoryRef->{ _id },
        items[]{ _key, pageRef->{ _id } }
      }
    }`
  );

  const aboutCat = nav.categories.find(
    (c) => c.categoryRef?._id === "category-about"
  );
  if (!aboutCat) {
    throw new Error("Could not find 'about' category in navigation");
  }

  const alreadyInNav = aboutCat.items.some(
    (it) => it.pageRef?._id === "page-contact"
  );

  if (alreadyInNav) {
    console.log("\npage-contact already in navigation — skipping.");
  } else {
    console.log("\n=== 2. Append contact to about category in navigation ===");
    console.log("  Category: about (_key:", aboutCat._key + ")");
    console.log("  Adding pageRef → page-contact");

    if (!DRY_RUN) {
      // Append to the about category's items array
      await client
        .patch(nav._id)
        .insert("after", `categories[_key == "${aboutCat._key}"].items[-1]`, [
          {
            _key: "contact",
            _type: "object",
            pageRef: { _type: "reference", _ref: "page-contact" },
          },
        ])
        .commit();
      console.log("  Appended.");
    }
  }

  if (DRY_RUN) {
    console.log("\n[DRY RUN] No changes written.\n");
  } else {
    console.log("\nMigration complete.\n");
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
