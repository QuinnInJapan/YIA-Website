import { defineType, defineField } from "sanity";

export default defineType({
  name: "announcement",
  title: "お知らせ",
  type: "document",
  preview: {
    select: { title: "titleJa", subtitle: "date" },
  },
  fields: [
    defineField({ name: "id", title: "ID", type: "string" }),
    defineField({ name: "date", title: "日付", type: "date" }),
    defineField({ name: "urgent", title: "緊急", type: "boolean" }),
    defineField({ name: "titleJa", title: "タイトル（日本語）", type: "string" }),
    defineField({ name: "titleEn", title: "タイトル（英語）", type: "string" }),
    defineField({ name: "contentJa", title: "内容（日本語）", type: "text" }),
    defineField({ name: "contentEn", title: "内容（英語）", type: "text" }),
    defineField({
      name: "documents",
      title: "資料",
      type: "array",
      of: [{ type: "documentLink" }],
    }),
    defineField({ name: "image", title: "画像", type: "string" }),
  ],
});
