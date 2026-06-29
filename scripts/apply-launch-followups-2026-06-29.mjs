#!/usr/bin/env node

import { fail, i18n, logSummary, patchWithRevision, runSanityScript } from "./lib/sanity-tools.mjs";

const DOC_IDS = [
  "page-kaiwasalon",
  "drafts.page-kaiwasalon",
  "page-gaikokugo",
  "drafts.page-gaikokugo",
  "page-cooking",
  "drafts.page-cooking",
  "page-sistercity",
  "drafts.page-sistercity",
  "page-aboutyia",
  "drafts.page-aboutyia",
];

const POTLUCK_URL = "https://yoshiefoot215mm.wixsite.com/potluckinternational";
const SISTER_CITY_URL = "https://www.city.yokosuka.kanagawa.jp/0535/g_info/l100050650.html";

await runSanityScript({
  name: "Apply 2026-06-29 launch follow-up feedback",
  description: "Targeted Sanity content patches for the latest follow-up feedback batch.",
  async handler({ client, dryRun }) {
    const docs = await client.fetch(`*[_id in $ids]{_id,_rev,sections}`, { ids: DOC_IDS });
    const transforms = new Map([
      ["page-kaiwasalon", updateConversationSalon],
      ["page-gaikokugo", updateForeignLanguage],
      ["page-cooking", updateCooking],
      ["page-sistercity", updateSisterCity],
      ["page-aboutyia", updateAboutYia],
    ]);

    let patched = 0;
    let skippedUnchanged = 0;
    const results = [];

    for (const doc of docs ?? []) {
      const baseId = doc._id.replace(/^drafts\./, "");
      const transform = transforms.get(baseId);
      if (!transform) continue;

      const before = doc.sections ?? [];
      const sections = transform(structuredClone(before));
      const changed = JSON.stringify(before) !== JSON.stringify(sections);

      if (!changed) {
        skippedUnchanged += 1;
        results.push({ docId: doc._id, changed: false });
        continue;
      }

      await patchWithRevision(client, doc, { sections }, { dryRun });
      patched += 1;
      results.push({ docId: doc._id, changed: true });
    }

    logSummary({
      dryRun,
      found: docs?.length ?? 0,
      patched,
      skippedUnchanged,
      results,
    });
  },
});

function updateConversationSalon(sections) {
  if (conversationSalonAlreadyUpdated(sections)) return sections;

  const note = removeSection(sections, "terakoya-location-note");
  const potluck = removeSection(sections, "potluck-link");

  insertAfter(
    sections,
    "key57",
    note ?? {
      _key: "terakoya-location-note",
      _type: "content",
      tocLevel: "hidden",
      title: i18n("", ""),
      body: [
        textBody(
          "ja",
          "○がついている日は別の場所で授業をします。先生に場所を聞いてください。",
          "terakoya-note-ja",
        ),
        textBody(
          "en",
          "Classes marked with ○ are held at a different location. Please ask the teacher for the location.",
          "terakoya-note-en",
        ),
      ],
    },
  );

  insertAfter(
    sections,
    "adult-other-location-schedule",
    linkTextSection(potluck, {
      key: "potluck-link",
      textJa: "ポットラック インターナショナル",
      textEn: "Potluck International",
      href: getFirstUrl(potluck) ?? POTLUCK_URL,
      markKey: "potluck-website-link",
      blockKeyPrefix: "potluck",
    }),
  );

  return sections;
}

function conversationSalonAlreadyUpdated(sections) {
  const noteIndex = sections.findIndex((section) => section._key === "terakoya-location-note");
  const linksIndex = sections.findIndex((section) => section._key === "key57");
  const potluckIndex = sections.findIndex((section) => section._key === "potluck-link");
  const otherClassesIndex = sections.findIndex(
    (section) => section._key === "adult-other-location-schedule",
  );
  const potluck = sections[potluckIndex];

  return (
    noteIndex === linksIndex + 1 &&
    potluckIndex === otherClassesIndex + 1 &&
    potluck?._type === "content" &&
    getBodyText(potluck, "ja") === "ポットラック インターナショナル" &&
    getBodyLink(potluck, "ja") === POTLUCK_URL
  );
}

function updateForeignLanguage(sections) {
  removeSection(sections, "class-overview");
  const downloads = removeSection(sections, "key100");
  if (!downloads) {
    throw fail("Could not find the foreign-language downloads section.", {
      fix: "Confirm page-gaikokugo still has section key100 before rerunning.",
      context: { pageId: "page-gaikokugo", sectionKey: "key100" },
    });
  }

  downloads.title = i18n("講座資料", "Course Materials");
  downloads.tocLevel = "subsection";
  insertAfter(sections, "5816ea54-405", downloads);
  return sections;
}

function updateCooking(sections) {
  const table = requireSection(sections, "key179", "table");
  setColumnTranslation(table, 0, "Year");
  setColumnTranslation(table, 1, "Cuisine");
  return sections;
}

function updateSisterCity(sections) {
  const schedule = requireSection(sections, "1d65d433-a0e", "labelTable");
  upsertRowAfter(schedule.rows, "corpus-christi-2026", {
    _key: "brest-2026",
    label: i18n("ブレスト", "Brest"),
    value: i18n("８月12日から８月26日", "August 12-26"),
  });

  const linkSection = removeSection(sections, "p010-sister-city-link");
  const cityCards = requireSection(sections, "key206", "imageCards");
  if (linkSection || !cityCards.body) {
    cityCards.body = getBody(linkSection) ?? [
      linkBlockBody("ja", "姉妹都市の紹介はこちら", SISTER_CITY_URL, "p010-city-link", "p010-ja"),
      { _key: "en", value: [] },
    ];
  }
  return sections;
}

function updateAboutYia(sections) {
  const overview = requireSection(sections, "key223", "labelTable");
  const staff = requireRow(overview.rows, "key227");
  staff.value = i18n(
    "職員：７名、外国人生活相談員：４名（令和６年４月１日現在）",
    "Staff: 7; foreign resident counselors: 4 (as of April 1, 2024)",
  );

  const history = requireSection(sections, "key234", "table");
  replaceHistoryText(history, "1997", [["発足", "設立"]]);
  replaceHistoryText(history, "1998", [["新事業", "新規事業"]]);
  replaceHistoryText(history, "2008", [["理事長交代　藤井長生", "理事長交代（藤井長生）"]]);
  replaceHistoryText(history, "2013", [["理事長交代　安東崇夫", "理事長交代（安東崇夫）"]]);
  return sections;
}

function removeSection(sections, key) {
  const index = sections.findIndex((section) => section._key === key);
  if (index < 0) return null;
  return sections.splice(index, 1)[0];
}

function insertAfter(sections, afterKey, section) {
  removeSection(sections, section._key);
  const index = sections.findIndex((item) => item._key === afterKey);
  if (index < 0) {
    throw fail("Could not find insertion target section.", {
      fix: "Check the current Sanity page section keys before rerunning.",
      context: { afterKey, insertedKey: section._key },
    });
  }
  sections.splice(index + 1, 0, section);
}

function requireSection(sections, key, type) {
  const section = sections.find((item) => item._key === key);
  if (!section) {
    throw fail("Required section was not found.", {
      fix: "Check the current Sanity page section keys before rerunning.",
      context: { key, type },
    });
  }
  if (type && section._type !== type) {
    throw fail("Required section has the wrong type.", {
      fix: "Update the script target to match the current Sanity schema.",
      context: { key, expected: type, actual: section._type },
    });
  }
  return section;
}

function requireRow(rows, key) {
  const row = rows?.find((item) => item._key === key);
  if (!row) {
    throw fail("Required row was not found.", {
      fix: "Check the current Sanity row keys before rerunning.",
      context: { key },
    });
  }
  return row;
}

function upsertRowAfter(rows, afterKey, nextRow) {
  const existing = rows.find((row) => row._key === nextRow._key);
  if (existing) {
    existing.label = nextRow.label;
    existing.value = nextRow.value;
    return;
  }

  const afterIndex = rows.findIndex((row) => row._key === afterKey);
  rows.splice(afterIndex >= 0 ? afterIndex + 1 : rows.length, 0, nextRow);
}

function setColumnTranslation(table, index, enValue) {
  const column = table.columns?.[index];
  if (!column) {
    throw fail("Required table column was not found.", {
      fix: "Check the cooking history table columns before rerunning.",
      context: { sectionKey: table._key, index },
    });
  }
  column.label = setI18nValue(column.label, "en", enValue);
}

function replaceHistoryText(table, year, replacements) {
  const row = table.rows?.find((item) => getI18nValue(item.cells?.[0], "ja") === year);
  if (!row) {
    throw fail("Required history year row was not found.", {
      fix: "Check the YIA history table before rerunning.",
      context: { year },
    });
  }

  let value = getI18nValue(row.cells?.[1], "ja");
  for (const [from, to] of replacements) value = value.replace(from, to);
  row.cells[1] = setI18nValue(row.cells[1], "ja", value);
}

function getFirstUrl(section) {
  return section?.items?.find((item) => typeof item.url === "string" && item.url)?.url ?? null;
}

function getBody(section) {
  return section?.body ? structuredClone(section.body) : null;
}

function linkTextSection(existing, { key, textJa, textEn, href, markKey, blockKeyPrefix }) {
  const base = existing?._type === "content" ? existing : {};
  return {
    ...base,
    _key: key,
    _type: "content",
    tocLevel: "hidden",
    title: i18n("", ""),
    body: [
      linkBlockBody("ja", textJa, href, markKey, `${blockKeyPrefix}-ja`),
      linkBlockBody("en", textEn, href, markKey, `${blockKeyPrefix}-en`),
    ],
  };
}

function textBody(lang, text, keyPrefix) {
  return {
    _key: lang,
    value: [
      {
        _key: `${keyPrefix}-block`,
        _type: "block",
        style: "normal",
        markDefs: [],
        children: [
          {
            _key: `${keyPrefix}-span`,
            _type: "span",
            text,
            marks: [],
          },
        ],
      },
    ],
  };
}

function linkBlockBody(lang, text, href, markKey, keyPrefix) {
  return {
    _key: lang,
    value: [
      {
        _key: `${keyPrefix}-block`,
        _type: "block",
        style: "normal",
        markDefs: [{ _key: markKey, _type: "link", href }],
        children: [
          {
            _key: `${keyPrefix}-span`,
            _type: "span",
            text,
            marks: [markKey],
          },
        ],
      },
    ],
  };
}

function getI18nValue(field, lang) {
  return field?.find((entry) => entry._key === lang)?.value ?? "";
}

function setI18nValue(field, lang, value) {
  const next = Array.isArray(field) ? structuredClone(field) : [];
  const index = next.findIndex((entry) => entry._key === lang);
  if (index >= 0) next[index] = { ...next[index], value };
  else next.push({ _key: lang, value });
  return next;
}

function getBodyText(section, lang) {
  return (
    section.body
      ?.find((entry) => entry._key === lang)
      ?.value?.flatMap((block) => block.children ?? [])
      .map((child) => child.text ?? "")
      .join("") ?? ""
  );
}

function getBodyLink(section, lang) {
  const block = section.body?.find((entry) => entry._key === lang)?.value?.[0];
  const firstMark = block?.children?.[0]?.marks?.[0];
  return block?.markDefs?.find((mark) => mark._key === firstMark)?.href ?? "";
}
