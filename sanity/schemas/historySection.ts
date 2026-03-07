import { defineType, defineField } from "sanity";
import { ClockIcon } from "@sanity/icons";

export default defineType({
  name: "history",
  title: "沿革セクション",
  type: "object",
  description: "団体の沿革・歴史年表。年度ごとの活動をテーブル形式で表示します。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "沿革セクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "History",
      media: ClockIcon,
    }),
  },
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "intro",
      title: "紹介文",
      type: "internationalizedArrayBlockContent",
      description: "年表の前に表示する説明文（任意）。",
    }),
    defineField({
      name: "columns",
      title: "列見出し（日本語）",
      type: "array",
      of: [{ type: "string" }],
      description: "年表の列名（日本語）。",
    }),
    defineField({
      name: "columnsEn",
      title: "列見出し（英語）",
      type: "array",
      of: [{ type: "string" }],
      description: "年表の列名（英語）。",
    }),
    defineField({
      name: "years",
      title: "年度",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "year", title: "年", type: "string", description: "年度（例：2024）。", validation: (Rule) => Rule.required() }),
            defineField({ name: "cuisines", title: "料理", type: "string", description: "その年の内容。", validation: (Rule) => Rule.required() }),
          ],
        },
      ],
      description: "年度ごとの情報。各行が年表の1行になります。",
    }),
  ],
});
