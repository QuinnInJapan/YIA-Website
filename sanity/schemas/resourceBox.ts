import { defineType, defineField } from "sanity";

export default defineType({
  name: "resourceBox",
  title: "リソースボックス",
  type: "object",
  fields: [
    defineField({ name: "id", title: "ID", type: "string" }),
    defineField({ name: "titleJa", title: "タイトル（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "titleEasy", title: "タイトル（やさしい日本語）", type: "string" }),
    defineField({ name: "titleEn", title: "タイトル（英語）", type: "string" }),
    defineField({ name: "url", title: "URL", type: "string" }),
    defineField({ name: "attribution", title: "出典", type: "string" }),
    defineField({
      name: "links",
      title: "リンク",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "lang", title: "言語", type: "string", validation: (Rule) => Rule.required() }),
            defineField({ name: "label", title: "ラベル", type: "string", validation: (Rule) => Rule.required() }),
            defineField({ name: "labelEasy", title: "ラベル（やさしい日本語）", type: "string" }),
            defineField({ name: "subtitle", title: "サブタイトル", type: "string" }),
            defineField({ name: "url", title: "URL", type: "string" }),
          ],
        },
      ],
    }),
  ],
});
