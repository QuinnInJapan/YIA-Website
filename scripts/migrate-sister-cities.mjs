/**
 * Migration: Convert sisterCity.country + countryJa into i18n array format
 *
 * Before: { country: "USA", countryJa: "アメリカ" }
 * After:  { country: [{ _key: "ja", value: "アメリカ" }, { _key: "en", value: "USA" }] }
 *
 * Run:
 *   export $(grep SANITY_TOKEN .env.local) && node scripts/migrate-sister-cities.mjs
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

async function main() {
  // Find all pages that have sisterCities sections
  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      sections[_type == "sisterCities"]{
        _key,
        cities
      }
    }[count(sections) > 0]`
  );

  let patchCount = 0;

  for (const page of pages) {
    for (const section of page.sections) {
      if (!section.cities?.length) continue;

      let needsPatch = false;
      const updatedCities = section.cities.map((city) => {
        // Already migrated — country is an array
        if (Array.isArray(city.country)) return city;

        needsPatch = true;
        const countryEn = city.country || "";
        const countryJa = city.countryJa || countryEn;

        const { countryJa: _cj, country: _c, ...rest } = city;
        return {
          ...rest,
          country: [
            { _key: "ja", value: countryJa },
            { _key: "en", value: countryEn },
          ],
        };
      });

      if (!needsPatch) continue;

      console.log(`${DRY_RUN ? "[DRY RUN] " : ""}Patching ${page._id}, section ${section._key}:`);
      for (const c of updatedCities) {
        const ja = Array.isArray(c.country) ? c.country.find((e) => e._key === "ja")?.value : c.country;
        const en = Array.isArray(c.country) ? c.country.find((e) => e._key === "en")?.value : c.country;
        console.log(`  ${en} / ${ja}`);
      }

      if (!DRY_RUN) {
        // Patch each city's country field in the section
        await client
          .patch(page._id)
          .set({
            [`sections[_key=="${section._key}"].cities`]: updatedCities,
          })
          .commit();
        patchCount++;
      }
    }
  }

  console.log(`\nDone. ${DRY_RUN ? "Would patch" : "Patched"} ${patchCount} section(s).`);
}

main().catch(console.error);
