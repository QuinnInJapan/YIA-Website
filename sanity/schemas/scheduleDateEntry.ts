import { defineType, defineField } from "sanity";

export default defineType({
  name: "scheduleDateEntry",
  title: "スケジュール日程",
  type: "object",
  fields: [
    defineField({ name: "date", title: "日付", type: "date", validation: (Rule) => Rule.required() }),
    defineField({ name: "time", title: "時間", type: "string" }),
    defineField({ name: "location", title: "場所", type: "internationalizedArrayString" }),
    defineField({ name: "description", title: "説明", type: "internationalizedArrayString" }),
  ],
});
