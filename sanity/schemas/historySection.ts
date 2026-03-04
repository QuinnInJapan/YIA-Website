import { defineType, defineField } from "sanity";
import { ClockIcon } from "@sanity/icons";

export default defineType({
  name: "history",
  title: "沿革セクション",
  type: "object",
  description: "団体の沿革・歴史年表",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "沿革セクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "History",
      media: ClockIcon,
    }),
  },
  fields: [
    defineField({ name: "title", title: "タイトル", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
    defineField({ name: "intro", title: "紹介文", type: "internationalizedArrayText" }),
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
