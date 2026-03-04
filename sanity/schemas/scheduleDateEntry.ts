import { defineType, defineField } from "sanity";

export default defineType({
  name: "scheduleDateEntry",
  title: "スケジュール日程",
  type: "object",
  fields: [
    defineField({ name: "date", title: "日付", type: "date", validation: (Rule) => Rule.required() }),
    defineField({ name: "time", title: "時間", type: "string" }),
    defineField({ name: "locationJa", title: "場所（日本語）", type: "string" }),
    defineField({ name: "locationEn", title: "場所（英語）", type: "string" }),
    defineField({ name: "descriptionJa", title: "説明（日本語）", type: "string" }),
    defineField({ name: "descriptionEn", title: "説明（英語）", type: "string" }),
  ],
});
