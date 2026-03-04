import { defineType, defineField } from "sanity";

export default defineType({
  name: "boardMember",
  title: "役員",
  type: "object",
  fields: [
    defineField({ name: "name", title: "名前", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "roleJa", title: "役職（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "roleEn", title: "役職（英語）", type: "string", validation: (Rule) => Rule.required() }),
  ],
});
