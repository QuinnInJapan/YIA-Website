/**
 * Migrate internationalizedArrayStringValue → internationalizedArrayTextValue
 * for specific fields in blog posts.
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | grep '=' | xargs)
 *   node scripts/migrate-i18n-type.mjs
 */

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

async function main() {
  const posts = await client.fetch(`*[_type == "blogPost"]{ _id, title, excerpt, category }`);
  console.log(`Found ${posts.length} blog posts\n`);

  let patchCount = 0;

  for (const post of posts) {
    const patches = {};

    // Fix excerpt: stringValue → textValue
    if (Array.isArray(post.excerpt)) {
      const needsFix = post.excerpt.some((e) => e._type === "internationalizedArrayStringValue");
      if (needsFix) {
        patches.excerpt = post.excerpt.map((e) => ({
          ...e,
          _type: "internationalizedArrayTextValue",
        }));
      }
    }

    // Fix category: string → stringValue (if it was a plain string, convert to i18n array)
    if (typeof post.category === "string" && post.category) {
      patches.category = [
        { _key: "ja", _type: "internationalizedArrayStringValue", value: post.category },
      ];
    }

    if (Object.keys(patches).length > 0) {
      patchCount++;
      const label = post.title?.[0]?.value || post._id;
      console.log(`📝 ${label}: patching ${Object.keys(patches).join(", ")}`);
      await client.patch(post._id).set(patches).commit();
      console.log(`   ✅ saved`);
    }
  }

  console.log(`\nPatched ${patchCount} document(s).`);
}

main().catch(console.error);
