import { defineType, defineField } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";

export default defineType({
  name: "content",
  title: "コンテンツセクション",
  type: "object",
  description: "汎用コンテンツブロック（説明文、情報テーブル、チェックリスト、資料リンクなど）",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "コンテンツセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Content",
      media: DocumentTextIcon,
    }),
  },
  fields: [
    defineField({ name: "id", title: "ID", type: "string" }),
    defineField({ name: "title", title: "タイトル", type: "internationalizedArrayString" }),
    defineField({ name: "description", title: "説明", type: "internationalizedArrayBlockContent" }),
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
            defineField({ name: "label", title: "ラベル", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
            defineField({ name: "note", title: "備考", type: "internationalizedArrayString" }),
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
    defineField({ name: "note", title: "備考", type: "internationalizedArrayBlockContent" }),
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
