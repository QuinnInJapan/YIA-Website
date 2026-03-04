import { defineType, defineField } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";

export default defineType({
  name: "content",
  title: "コンテンツセクション",
  type: "object",
  preview: {
    select: { title: "titleJa", subtitle: "titleEn" },
    prepare: ({ title, subtitle }: { title?: string; subtitle?: string }) => ({
      title: title || "コンテンツセクション",
      subtitle: subtitle || "Content",
      media: DocumentTextIcon,
    }),
  },
  fields: [
    defineField({ name: "id", title: "ID", type: "string" }),
    defineField({ name: "titleJa", title: "タイトル（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "titleEn", title: "タイトル（英語）", type: "string" }),
    defineField({ name: "descriptionJa", title: "説明（日本語）", type: "text" }),
    defineField({ name: "descriptionEn", title: "説明（英語）", type: "text" }),
    defineField({
      name: "infoTable",
      title: "情報テーブル",
      type: "array",
      of: [{ type: "infoRow" }],
    }),
    defineField({
      name: "checklist",
      title: "チェックリスト",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "labelJa", title: "ラベル（日本語）", type: "string", validation: (Rule) => Rule.required() }),
            defineField({ name: "labelEn", title: "ラベル（英語）", type: "string" }),
            defineField({ name: "noteJa", title: "備考（日本語）", type: "string" }),
            defineField({ name: "noteEn", title: "備考（英語）", type: "string" }),
          ],
        },
      ],
    }),
    defineField({
      name: "documents",
      title: "資料",
      type: "array",
      of: [{ type: "documentLink" }],
    }),
    defineField({ name: "noteJa", title: "備考（日本語）", type: "text" }),
    defineField({ name: "noteEn", title: "備考（英語）", type: "text" }),
    defineField({
      name: "images",
      title: "画像",
      type: "array",
      of: [{ type: "imageFile" }],
    }),
    defineField({
      name: "schedule",
      title: "スケジュール",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "city", title: "都市", type: "string", validation: (Rule) => Rule.required() }),
            defineField({ name: "period", title: "期間", type: "string", validation: (Rule) => Rule.required() }),
          ],
        },
      ],
    }),
  ],
});
