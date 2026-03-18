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
 * Image-dependent types (gallery, flyers, sisterCities) are excluded —
 * they need Sanity asset refs that can't be resolved in the Studio context.
 */
export const sampleSections: Partial<Record<SectionTypeName, PageSection>> = {
  content: {
    _type: "content",
    title: i18n("活動について", "About Activities"),
    description: i18n(
      "国際交流協会は、地域に住む外国人住民と日本人住民が共に暮らしやすいまちづくりを目指して活動しています。",
      "The International Association works to build a community where foreign and Japanese residents can live together comfortably.",
    ),
  },

  infoTable: {
    _type: "infoTable",
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

  links: {
    _type: "links",
    title: i18n("資料ダウンロード", "Downloads"),
    items: [
      { label: i18n("申込書", "Application Form"), url: "#", type: "PDF" },
      { label: i18n("活動報告書", "Activity Report"), url: "#", type: "PDF" },
      { label: i18n("会則", "Bylaws"), url: "#", type: "PDF" },
    ],
  },

  warnings: {
    _type: "warnings",
    items: [
      i18n(
        "参加には事前申し込みが必要です。定員になり次第締め切ります。",
        "Pre-registration is required. Registration closes when capacity is reached.",
      ),
    ],
  },

  eventSchedule: {
    _type: "eventSchedule",
    title: i18n("イベント日程", "Event Schedule"),
    entries: [
      { date: "2025-04-12", time: "10:00", description: i18n("開会式", "Opening Ceremony") },
      { date: "2025-05-10", time: "13:00", description: i18n("交流会", "Exchange Event") },
      { date: "2025-06-14", time: "10:00", description: i18n("文化体験", "Cultural Experience") },
    ],
  },

  groupSchedule: {
    _type: "groupSchedule",
    title: i18n("教室スケジュール", "Class Schedule"),
    groups: [
      {
        name: i18n("日本語初級クラス", "Beginner Japanese"),
        day: "月曜日",
        time: "10:00〜12:00",
        location: "交流センター",
        timeSlot: "morning",
      },
      {
        name: i18n("英会話サークル", "English Conversation"),
        day: "月曜日",
        time: "14:00〜16:00",
        location: "交流センター",
        timeSlot: "afternoon",
      },
      {
        name: i18n("中国語講座", "Chinese Class"),
        day: "水曜日",
        time: "10:00〜12:00",
        location: "公民館",
        timeSlot: "morning",
      },
    ],
  },

  tableSchedule: {
    _type: "tableSchedule",
    title: i18n("時間割", "Timetable"),
    columns: ["時間", "月", "火", "水"],
    rows: [
      ["10:00", "初級A", "中級", "初級B"],
      ["13:00", "会話", "—", "JLPT対策"],
      ["15:00", "—", "上級", "会話"],
    ],
  },

  definitions: {
    _type: "definitions",
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

  feeTable: {
    _type: "feeTable",
    title: i18n("会費", "Membership Fees"),
    rows: [
      { memberType: i18n("個人会員", "Individual"), fee: i18n("3,000円", "¥3,000") },
      { memberType: i18n("家族会員", "Family"), fee: i18n("5,000円", "¥5,000") },
      { memberType: i18n("団体会員", "Organization"), fee: i18n("10,000円", "¥10,000") },
    ],
  },

  directoryList: {
    _type: "directoryList",
    title: i18n("連絡先一覧", "Contact Directory"),
    entries: [
      { nameJa: "市民交流センター", tel: "0123-45-6789" },
      { nameJa: "国際交流協会", tel: "0123-45-0000" },
      { nameJa: "多文化共生センター", tel: "0123-45-1111" },
    ],
  },

  boardMembers: {
    _type: "boardMembers",
    title: i18n("役員一覧", "Board Members"),
    asOf: "2025-04-01",
    members: [
      { name: "山田太郎", role: i18n("会長", "President") },
      { name: "佐藤花子", role: i18n("副会長", "Vice President") },
      { name: "田中一郎", role: i18n("理事", "Director") },
      { name: "鈴木次郎", role: i18n("監事", "Auditor") },
    ],
  },

  fairTrade: {
    _type: "fairTrade",
    title: i18n("フェアトレード", "Fair Trade"),
    description: i18n(
      "フェアトレード商品を販売しています。途上国の生産者を支援する取り組みです。",
      "We sell fair trade products to support producers in developing countries.",
    ),
    priceList: [
      {
        type: i18n("コーヒー", "Coffee"),
        weight: i18n("200g", "200g"),
        price: i18n("¥800", "¥800"),
      },
      { type: i18n("紅茶", "Tea"), weight: i18n("100g", "100g"), price: i18n("¥600", "¥600") },
    ],
  },

  history: {
    _type: "history",
    title: i18n("沿革", "History"),
    years: [
      { year: "1990", cuisines: "国際交流協会設立" },
      { year: "1995", cuisines: "姉妹都市提携締結" },
      { year: "2005", cuisines: "多文化共生センター開設" },
    ],
  },
};
