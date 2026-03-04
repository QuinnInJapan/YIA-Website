import { defineType, defineField } from "sanity";

export default defineType({
  name: "definition",
  title: "用語定義",
  type: "object",
  fields: [
    defineField({ name: "term", title: "用語", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
    defineField({ name: "definition", title: "定義", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
  ],
});
