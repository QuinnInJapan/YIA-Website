import { defineType, defineField } from "sanity";
import { UlistIcon } from "@sanity/icons";

export default defineType({
  name: "directoryList",
  title: "一覧セクション",
  type: "object",
  preview: {
    select: { title: "titleJa", subtitle: "titleEn" },
    prepare: ({ title, subtitle }: { title?: string; subtitle?: string }) => ({
      title: title || "一覧セクション",
      subtitle: subtitle || "Directory List",
      media: UlistIcon,
    }),
  },
  fields: [
    defineField({ name: "titleJa", title: "タイトル（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "titleEn", title: "タイトル（英語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "entries",
      title: "一覧",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "nameJa", title: "名前（日本語）", type: "string" }),
            defineField({ name: "tel", title: "電話番号", type: "string" }),
            defineField({ name: "url", title: "URL", type: "string" }),
          ],
        },
      ],
    }),
  ],
});
