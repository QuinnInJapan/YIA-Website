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
    defineField({ name: "title", title: "タイトル", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
  ],
});
