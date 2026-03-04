import { defineType, defineField } from "sanity";

export default defineType({
  name: "resourceLink",
  title: "リソースリンク",
  type: "object",
  fields: [
    defineField({
      name: "type",
      title: "種類",
      type: "string",
      options: { list: [{ title: "YouTube", value: "youtube" }] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "url", title: "URL", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "titleJa", title: "タイトル（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "titleEn", title: "タイトル（英語）", type: "string" }),
  ],
});
