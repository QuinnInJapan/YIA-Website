import { defineType, defineField } from "sanity";

export default defineType({
  name: "bilingualText",
  title: "バイリンガルテキスト",
  type: "object",
  fields: [
    defineField({ name: "ja", title: "日本語", type: "string" }),
    defineField({ name: "en", title: "英語", type: "string" }),
  ],
});
