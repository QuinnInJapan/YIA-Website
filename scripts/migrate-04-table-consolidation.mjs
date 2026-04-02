/**
 * Migration 04: Consolidate 7 section types into `table`
 *
 * tableSchedule → table  (pages: page-cooking, page-seikatsusodan)
 * history       → table  (page: page-aboutyia; intro → standalone content before)
 * feeTable      → table  (page: page-kaiinn)
 * groupSchedule → table  (page: page-kaiwasalon)
 * boardMembers  → table  (page: page-aboutyia; asOf → caption)
 * directoryList → table  (page: page-sanjyokaiin)
 * eventSchedule (multi-date, entries array) → table (pages: page-englishguide, page-nihonbunka)
 *
 * Run:
 *   export SANITY_TOKEN=<token> && node scripts/migrate-04-table-consolidation.mjs
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

function convertTableSchedule(sec) {
  const cols = (sec.columns ?? []).map((col, i) => ({
    _key: randomKey(),
    label: bi(col, sec.columnsEn?.[i] ?? ""),
    type: "text",
  }));

  let rows = [];
  if (typeof sec.rows === "string") {
    try {
      const parsed = JSON.parse(sec.rows);
      rows = parsed.map((r) => ({
        _key: randomKey(),
        cells: r.map((v) => bi(v, "")),
      }));
    } catch {
      rows = [];
    }
  } else if (Array.isArray(sec.rows)) {
    rows = sec.rows.map((r) => {
      const cells = Array.isArray(r.cells) ? r.cells : Array.isArray(r) ? r : [];
      return {
        _key: randomKey(),
        cells: cells.map((c) => {
          if (typeof c === "string") return bi(c, "");
          if (c.text) return bi(getVal(c.text, "ja"), getVal(c.text, "en"));
          return bi(getVal(c, "ja"), getVal(c, "en"));
        }),
      };
    });
  }

  return {
    _type: "table",
    _key: sec._key,
    title: sec.title,
    hideTitle: sec.hideTitle,
    columns: cols,
    rows,
  };
}

function convertHistory(sec) {
  const cols = (sec.columns ?? ["年", "内容"]).map((col, i) => ({
    _key: randomKey(),
    label: bi(col, sec.columnsEn?.[i] ?? ""),
    type: "text",
  }));

  const rows = (sec.years ?? []).map((entry) => ({
    _key: randomKey(),
    cells: [bi(entry.year, entry.year), bi(entry.cuisines, entry.cuisines)],
  }));

  return {
    tableSection: {
      _type: "table",
      _key: sec._key,
      title: sec.title,
      hideTitle: sec.hideTitle,
      columns: cols,
      rows,
    },
    introSection: sec.intro
      ? { _type: "content", _key: randomKey(), hideTitle: true, description: sec.intro }
      : null,
  };
}

function convertFeeTable(sec) {
  const cols = [
    { _key: randomKey(), label: bi("種別", "Type"), type: "name" },
    { _key: randomKey(), label: bi("会費", "Fee"), type: "currency" },
    { _key: randomKey(), label: bi("説明", "Description"), type: "text" },
  ];

  const rows = (sec.rows ?? []).map((r) => ({
    _key: randomKey(),
    cells: [
      bi(getVal(r.memberType, "ja"), getVal(r.memberType, "en")),
      bi(getVal(r.fee, "ja"), getVal(r.fee, "en")),
      bi(getVal(r.description, "ja"), getVal(r.description, "en")),
    ],
  }));

  return {
    _type: "table",
    _key: sec._key,
    title: sec.title,
    hideTitle: sec.hideTitle,
    columns: cols,
    rows,
  };
}

function convertGroupSchedule(sec) {
  const cols = [
    { _key: randomKey(), label: bi("グループ名", "Group"), type: "name" },
    { _key: randomKey(), label: bi("曜日", "Day"), type: "text" },
    { _key: randomKey(), label: bi("時間", "Time"), type: "text" },
    { _key: randomKey(), label: bi("場所", "Location"), type: "text" },
  ];

  const rows = (sec.groups ?? []).map((g) => ({
    _key: randomKey(),
    cells: [
      bi(getVal(g.name, "ja"), getVal(g.name, "en")),
      bi(g.day ?? "", g.day ?? ""),
      bi(g.time ?? "", g.time ?? ""),
      bi(g.location ?? "", g.location ?? ""),
    ],
  }));

  return {
    _type: "table",
    _key: sec._key,
    title: sec.title,
    hideTitle: sec.hideTitle,
    columns: cols,
    rows,
  };
}

function convertBoardMembers(sec) {
  const cols = [
    { _key: randomKey(), label: bi("氏名", "Name"), type: "name" },
    { _key: randomKey(), label: bi("役職", "Role"), type: "text" },
  ];

  const rows = (sec.members ?? []).map((m) => ({
    _key: randomKey(),
    cells: [bi(m.name ?? "", m.name ?? ""), bi(getVal(m.role, "ja"), getVal(m.role, "en"))],
  }));

  const caption = sec.asOf ? bi(`${sec.asOf}現在`, `As of ${sec.asOf}`) : undefined;

  return {
    _type: "table",
    _key: sec._key,
    title: sec.title,
    hideTitle: sec.hideTitle,
    caption,
    columns: cols,
    rows,
  };
}

function convertDirectoryList(sec) {
  const cols = [
    { _key: randomKey(), label: bi("団体名", "Organization"), type: "url" },
    { _key: randomKey(), label: bi("電話", "Tel"), type: "phone" },
  ];

  const rows = (sec.entries ?? []).map((e) => ({
    _key: randomKey(),
    cells: [bi(e.nameJa ?? "", e.url ?? ""), bi(e.tel ?? "", e.tel ?? "")],
  }));

  return {
    _type: "table",
    _key: sec._key,
    title: sec.title,
    hideTitle: sec.hideTitle,
    columns: cols,
    rows,
  };
}

function convertEventScheduleMulti(sec) {
  const cols = [
    { _key: randomKey(), label: bi("日付", "Date"), type: "date" },
    { _key: randomKey(), label: bi("時間", "Time"), type: "text" },
    { _key: randomKey(), label: bi("場所", "Venue"), type: "text" },
  ];

  const rows = (sec.entries ?? []).map((e) => ({
    _key: randomKey(),
    cells: [
      bi(e.date ?? "", e.date ?? ""),
      bi(e.time ?? "", e.time ?? ""),
      bi(getVal(e.location, "ja"), getVal(e.location, "en")),
    ],
  }));

  return {
    _type: "table",
    _key: sec._key,
    title: sec.title,
    hideTitle: sec.hideTitle,
    columns: cols,
    rows,
  };
}

const MULTI_DATE_EVENT_TYPES = [
  "tableSchedule",
  "feeTable",
  "groupSchedule",
  "boardMembers",
  "directoryList",
  "history",
];

async function main() {
  const allTypes = [...MULTI_DATE_EVENT_TYPES, "eventSchedule"];

  const pages = await client.fetch(
    `*[_type == "page" && defined(sections)]{
      _id,
      sections[_type in ${JSON.stringify(allTypes)}]
    }[count(sections) > 0]`,
  );

  let patchCount = 0;

  for (const page of pages) {
    for (const sec of page.sections) {
      let newSection = null;
      let insertBefore = null;

      if (sec._type === "tableSchedule") {
        newSection = convertTableSchedule(sec);
        console.log(
          `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: tableSchedule[${sec._key}] → table`,
        );
      } else if (sec._type === "history") {
        const { tableSection, introSection } = convertHistory(sec);
        newSection = tableSection;
        insertBefore = introSection;
        console.log(
          `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: history[${sec._key}] → table${introSection ? " + content before" : ""}`,
        );
      } else if (sec._type === "feeTable") {
        newSection = convertFeeTable(sec);
        console.log(`${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: feeTable[${sec._key}] → table`);
      } else if (sec._type === "groupSchedule") {
        newSection = convertGroupSchedule(sec);
        console.log(
          `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: groupSchedule[${sec._key}] → table`,
        );
      } else if (sec._type === "boardMembers") {
        newSection = convertBoardMembers(sec);
        console.log(`${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: boardMembers[${sec._key}] → table`);
      } else if (sec._type === "directoryList") {
        newSection = convertDirectoryList(sec);
        console.log(
          `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: directoryList[${sec._key}] → table`,
        );
      } else if (sec._type === "eventSchedule" && sec.entries?.length) {
        newSection = convertEventScheduleMulti(sec);
        console.log(
          `${DRY_RUN ? "[DRY RUN] " : ""}${page._id}: eventSchedule[${sec._key}] (multi) → table`,
        );
      } else {
        continue; // single-date eventSchedule handled in migrate-05
      }

      if (!DRY_RUN && newSection) {
        if (insertBefore) {
          await client
            .patch(page._id)
            .insert("before", `sections[_key=="${sec._key}"]`, [insertBefore])
            .commit();
        }

        const { _key, ...rest } = newSection;
        await client
          .patch(page._id)
          .set({ [`sections[_key=="${_key}"]`]: { _key, ...rest } })
          .commit();

        patchCount++;
      }
    }
  }

  console.log(`\nDone. ${DRY_RUN ? "Would patch" : "Patched"} ${patchCount} section(s).`);
}

main().catch(console.error);
