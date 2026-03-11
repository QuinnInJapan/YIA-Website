/**
 * Migrate fair trade priceList fields from plain strings to bilingual arrays.
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/migrate-fairtrade-bilingual.mjs
 */

import { createClient } from "next-sanity";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

async function run() {
  const page = await client.fetch(
    `*[_type == "page" && slug == "global-contribution"][0]{ _id, sections }`
  );
  if (!page) {
    console.log("Page not found");
    return;
  }

  const sections = page.sections.map((s) => {
    if (s._type !== "fairTrade" || !s.priceList) return s;
    return {
      ...s,
      priceList: s.priceList.map((p) => ({
        ...p,
        type:
          typeof p.type === "string"
            ? [{ _key: "ja", value: p.type }]
            : p.type,
        weight:
          typeof p.weight === "string"
            ? [{ _key: "ja", value: p.weight }]
            : p.weight,
        price:
          typeof p.price === "string"
            ? [{ _key: "ja", value: p.price }]
            : p.price,
      })),
    };
  });

  const result = await client.patch(page._id).set({ sections }).commit();
  console.log("Migrated price list to bilingual. Transaction:", result._id);
}

run().catch(console.error);
