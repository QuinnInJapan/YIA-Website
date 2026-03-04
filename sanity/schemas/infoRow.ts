import { defineType, defineField } from "sanity";

export default defineType({
  name: "infoRow",
  title: "情報行",
  type: "object",
  fields: [
    defineField({ name: "labelJa", title: "ラベル（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "labelEn", title: "ラベル（英語）", type: "string" }),
    defineField({ name: "valueJa", title: "値（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "valueEn", title: "値（英語）", type: "string" }),
  ],
});
