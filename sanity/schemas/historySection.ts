import { defineType, defineField } from "sanity";
import { ClockIcon } from "@sanity/icons";

export default defineType({
  name: "history",
  title: "沿革セクション",
  type: "object",
  preview: {
    select: { title: "titleJa", subtitle: "titleEn" },
    prepare: ({ title, subtitle }: { title?: string; subtitle?: string }) => ({
      title: title || "沿革セクション",
      subtitle: subtitle || "History",
      media: ClockIcon,
    }),
  },
  fields: [
    defineField({ name: "titleJa", title: "タイトル（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "titleEn", title: "タイトル（英語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "introJa", title: "紹介文（日本語）", type: "text" }),
    defineField({ name: "introEn", title: "紹介文（英語）", type: "text" }),
    defineField({ name: "columns", title: "列見出し（日本語）", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "columnsEn", title: "列見出し（英語）", type: "array", of: [{ type: "string" }] }),
    defineField({
      name: "years",
      title: "年度",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "year", title: "年", type: "string", validation: (Rule) => Rule.required() }),
            defineField({ name: "cuisines", title: "料理", type: "string", validation: (Rule) => Rule.required() }),
          ],
        },
      ],
    }),
  ],
});
