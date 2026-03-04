import { defineType, defineField } from "sanity";

export default defineType({
  name: "category",
  title: "カテゴリー",
  type: "document",
  preview: {
    select: { title: "labelJa", subtitle: "labelEn" },
  },
  fields: [
    defineField({ name: "id", title: "ID", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "labelJa", title: "ラベル（日本語）", type: "string" }),
    defineField({ name: "labelEn", title: "ラベル（英語）", type: "string" }),
    defineField({ name: "heroImage", title: "ヒーロー画像", type: "string" }),
  ],
});
