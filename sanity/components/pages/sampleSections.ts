import type { PageSection } from "@/lib/types";
import type { SectionTypeName } from "./types";

// Helper: bilingual i18n string
function i18n(ja: string, en: string) {
  return [
    { _key: "ja", value: ja },
    { _key: "en", value: en },
  ];
}

/**
 * Sample section data for each type, used to render real component previews
 * in the section picker. Every entry here goes through the actual
 * renderSections() pipeline, so the preview is always in sync with the
 * production rendering.
 *
 * Image-dependent types (gallery, imageCards) are excluded —
 * they need Sanity asset refs that can't be resolved in the Studio context.
 */
export const sampleSections: Partial<Record<SectionTypeName, PageSection>> = {
  content: {
    _type: "content",
    _key: "sample-content",
    title: i18n("活動について", "About Activities"),
    body: [
      {
        _key: "ja",
        value: [
          {
            _type: "block",
            _key: "sample-ja-1",
            style: "normal",
            children: [
              {
                _type: "span",
                _key: "sample-ja-1s",
                text: "国際交流協会は、地域に住む外国人住民と日本人住民が共に暮らしやすいまちづくりを目指して活動しています。",
                marks: [],
              },
            ],
            markDefs: [],
          },
        ],
      },
      {
        _key: "en",
        value: [
          {
            _type: "block",
            _key: "sample-en-1",
            style: "normal",
            children: [
              {
                _type: "span",
                _key: "sample-en-1s",
                text: "The International Association works to build a community where foreign and Japanese residents can live together comfortably.",
                marks: [],
              },
            ],
            markDefs: [],
          },
        ],
      },
    ],
  },

  links: {
    _type: "links",
    _key: "sample-links",
    title: i18n("資料ダウンロード", "Downloads"),
    items: [
      { label: i18n("申込書", "Application Form"), url: "#", type: "PDF" },
      { label: i18n("活動報告書", "Activity Report"), url: "#", type: "PDF" },
      { label: i18n("会則", "Bylaws"), url: "#", type: "PDF" },
    ],
  },

  warnings: {
    _type: "warnings",
    _key: "sample-warnings",
    items: [
      {
        _key: "sample0",
        value: i18n(
          "参加には事前申し込みが必要です。定員になり次第締め切ります。",
          "Pre-registration is required. Registration closes when capacity is reached.",
        ),
      },
    ],
  },

  table: {
    _type: "table",
    _key: "sample-table",
    title: i18n("スケジュール一覧", "Schedule List"),
    columns: [
      { _key: "col1", label: i18n("日時", "Date"), type: "date" },
      { _key: "col2", label: i18n("場所", "Location") },
      { _key: "col3", label: i18n("内容", "Content") },
    ],
    rows: [
      {
        _key: "row1",
        cells: [
          i18n("2025-04-12", "2025-04-12"),
          i18n("市民センター", "City Center"),
          i18n("開会式", "Opening"),
        ],
      },
      {
        _key: "row2",
        cells: [
          i18n("2025-05-10", "2025-05-10"),
          i18n("交流センター", "Exchange Center"),
          i18n("交流会", "Mixer"),
        ],
      },
    ],
  },

  labelTable: {
    _type: "labelTable",
    _key: "sample-labelTable",
    title: i18n("教室情報", "Class Information"),
    rows: [
      {
        label: i18n("日時", "Date"),
        value: i18n("毎月第2土曜日 10:00〜12:00", "2nd Saturday monthly, 10:00-12:00"),
      },
      { label: i18n("場所", "Location"), value: i18n("市民交流センター 3階", "Civic Center 3F") },
      {
        label: i18n("対象", "Eligibility"),
        value: i18n("市内在住の外国人", "Foreign residents of the city"),
      },
    ],
  },

  infoCards: {
    _type: "infoCards",
    _key: "sample-infoCards",
    title: i18n("用語集", "Glossary"),
    items: [
      {
        term: i18n("在留資格", "Residence Status"),
        definition: i18n("日本に滞在するための法的な資格", "Legal status to stay in Japan"),
      },
      {
        term: i18n("多文化共生", "Multicultural Coexistence"),
        definition: i18n(
          "異なる文化を持つ人々が共に暮らすこと",
          "People of different cultures living together",
        ),
      },
    ],
  },
};
