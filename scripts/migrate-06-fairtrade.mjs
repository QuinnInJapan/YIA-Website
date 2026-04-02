/**
 * Migration 06: Decompose fairTrade section into content + labelTable + content
 *
 * fairTrade.description → content section (before)
 * fairTrade.priceList   → labelTable (type→label, weight+price→value)
 * fairTrade.delivery    → content section (after)
 *
 * Affects: page-kokusaikoken (1 instance)
 *
 * Run:
 *   export SANITY_TOKEN=<token> && node scripts/migrate-06-fairtrade.mjs
 *   Add --dry-run to preview without writing.
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

function randomKey() {
  return crypto.randomUUID().slice(0, 12);
}

function bi(ja, en) {
  return [
    { _key: "ja", value: ja ?? "" },
    { _key: "en", value: en ?? "" },
  ];
}

function getVal(i18n, lang) {
  return i18n?.find((v) => v._key === lang)?.value ?? "";
}

async function main() {
  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      "sections": sections[_type == "fairTrade"]{
        _key,
        title,
        description,
        priceList,
        delivery
      }
    }[count(sections) > 0]`,
  );

  let patchCount = 0;

  for (const page of pages) {
    for (const sec of page.sections) {
      const replacements = [];

      if (sec.description) {
        replacements.push({
          _type: "content",
          _key: randomKey(),
          title: sec.title,
          hideTitle: false,
          description: sec.description,
        });
      }

      if (sec.priceList?.length) {
        const rows = sec.priceList.map((p) => {
          const jaWeight = getVal(p.weight, "ja");
          const enWeight = getVal(p.weight, "en");
          const jaPrice = getVal(p.price, "ja");
          const enPrice = getVal(p.price, "en");
          return {
            _key: randomKey(),
            label: bi(getVal(p.type, "ja"), getVal(p.type, "en")),
            value: bi(
              [jaWeight, jaPrice].filter(Boolean).join(" — "),
              [enWeight, enPrice].filter(Boolean).join(" — "),
            ),
          };
        });

        replacements.push({
          _type: "labelTable",
          _key: randomKey(),
          hideTitle: true,
          rows,
        });
      }

      if (sec.delivery) {
        replacements.push({
          _type: "content",
          _key: randomKey(),
          hideTitle: true,
          description: sec.delivery,
        });
      }

      console.log(
        `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: fairTrade[${sec._key}] → ${replacements.map((r) => r._type).join(" + ")}`,
      );

      if (!DRY_RUN) {
        // Insert replacements before the fairTrade section, then remove it
        await client
          .patch(page._id)
          .insert("before", `sections[_key=="${sec._key}"]`, replacements)
          .commit();

        await client
          .patch(page._id)
          .unset([`sections[_key=="${sec._key}"]`])
          .commit();

        patchCount++;
      }
    }
  }

  console.log(`\nDone. ${DRY_RUN ? "Would patch" : "Patched"} ${patchCount} section(s).`);
}

main().catch(console.error);
