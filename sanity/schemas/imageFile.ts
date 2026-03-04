import { defineType, defineField } from "sanity";

export default defineType({
  name: "imageFile",
  title: "画像ファイル",
  type: "object",
  fields: [
    defineField({ name: "file", title: "ファイル", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "captionJa", title: "キャプション（日本語）", type: "string" }),
    defineField({ name: "captionEn", title: "キャプション（英語）", type: "string" }),
  ],
});
