import { defineType, defineField } from "sanity";

export default defineType({
  name: "definition",
  title: "用語定義",
  type: "object",
  fields: [
    defineField({ name: "termJa", title: "用語（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "termEn", title: "用語（英語）", type: "string" }),
    defineField({ name: "definitionJa", title: "定義（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "definitionEn", title: "定義（英語）", type: "string" }),
  ],
});
