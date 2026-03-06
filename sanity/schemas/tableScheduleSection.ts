import { defineType, defineField } from "sanity";
import { CalendarIcon } from "@sanity/icons";

export default defineType({
  name: "tableSchedule",
  title: "テーブルスケジュール",
  type: "object",
  description: "列・行のシンプルなテーブル形式（曜日ベースやイベント一覧など）",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "テーブルスケジュール",
      subtitle: title?.find((t) => t._key === "en")?.value || "Table Schedule",
      media: CalendarIcon,
    }),
  },
  fields: [
    defineField({ name: "title", title: "タイトル", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
    defineField({
      name: "columns",
      title: "列見出し（日本語）",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "columnsEn",
      title: "列見出し（英語）",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "rows",
      title: "行",
      description: "各行のセルを配列で入力",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "cells",
              title: "セル",
              type: "array",
              of: [{ type: "string" }],
            }),
          ],
          preview: {
            select: { cells: "cells" },
            prepare: ({ cells }: { cells?: string[] }) => ({
              title: cells?.join(" | ") || "Empty row",
            }),
          },
        },
      ],
    }),
  ],
});
