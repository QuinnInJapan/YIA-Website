import { defineType, defineField } from "sanity";

export default defineType({
  name: "boardMember",
  title: "役員",
  type: "object",
  fields: [
    defineField({ name: "name", title: "名前", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "role", title: "役職", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
  ],
});
