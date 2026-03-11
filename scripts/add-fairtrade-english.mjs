/**
 * Add English translations to fair trade priceList.
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/add-fairtrade-english.mjs
 */

import { createClient } from "next-sanity";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

const translations = {
  key188: {
    type: "Type A (ground)",
    weight: "150g",
    price: "¥1,000 (tax included)",
  },
  key189: {
    type: "Type B (whole bean)",
    weight: "150g",
    price: "¥1,000 (tax included)",
  },
};

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
      priceList: s.priceList.map((p) => {
        const t = translations[p._key];
        if (!t) return p;
        return {
          ...p,
          type: [...p.type, { _key: "en", value: t.type }],
          weight: [...p.weight, { _key: "en", value: t.weight }],
          price: [...p.price, { _key: "en", value: t.price }],
        };
      }),
    };
  });

  const result = await client.patch(page._id).set({ sections }).commit();
  console.log("Added English translations. Transaction:", result._id);
}

run().catch(console.error);
