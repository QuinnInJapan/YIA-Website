import { defineType, defineField } from "sanity";
import { ThListIcon } from "@sanity/icons";

export default defineType({
  name: "infoTable",
  title: "情報テーブルセクション",
  type: "object",
  preview: {
    select: { title: "titleJa", subtitle: "titleEn" },
    prepare: ({ title, subtitle }: { title?: string; subtitle?: string }) => ({
      title: title || "情報テーブルセクション",
      subtitle: subtitle || "Info Table",
      media: ThListIcon,
    }),
  },
  fields: [
    defineField({ name: "titleJa", title: "タイトル（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "titleEn", title: "タイトル（英語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "rows",
      title: "行",
      type: "array",
      of: [{ type: "infoRow" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "appointmentNote", title: "予約についての注意", type: "bilingualText" }),
    defineField({ name: "additionalLanguageNote", title: "追加言語の注意", type: "bilingualText" }),
    defineField({ name: "otherNotes", title: "その他の注意", type: "bilingualText" }),
  ],
});
