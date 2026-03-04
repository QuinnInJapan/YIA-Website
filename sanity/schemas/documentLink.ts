import { defineType, defineField } from "sanity";

export default defineType({
  name: "documentLink",
  title: "資料リンク",
  type: "object",
  fields: [
    defineField({ name: "label", title: "ラベル", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "labelEn", title: "ラベル（英語）", type: "string" }),
    defineField({ name: "url", title: "URL", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "type", title: "種類", type: "string" }),
  ],
});
