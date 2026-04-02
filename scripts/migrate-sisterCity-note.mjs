// scripts/migrate-sisterCity-note.mjs
import { createClient } from "next-sanity";

const client = createClient({
  projectId: "tarzpcp3",
  dataset: "production",
  token: process.env.SANITY_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

// Find all pages with imageCards sections that have string note values
const pages = await client.fetch(
  `*[_type == "page" && count(sections[_type == "imageCards"]) > 0]{ _id, sections }`,
);
let patched = 0;

for (const page of pages) {
  const updatedSections = page.sections.map((section) => {
    if (section._type !== "imageCards") return section;
    const updatedItems = (section.items ?? []).map((item) => {
      if (typeof item.note !== "string") return item;
      const wrapped = [
        { _key: "ja", value: item.note },
        { _key: "en", value: "" },
      ];
      console.log(`Page ${page._id}: wrapping note "${item.note}" → internationalizedArrayString`);
      patched++;
      return { ...item, note: wrapped };
    });
    return { ...section, items: updatedItems };
  });

  await client.patch(page._id).set({ sections: updatedSections }).commit();
}

console.log(`\nDone. Patched ${patched} sisterCity item(s).`);
