import { defineType, defineField } from "sanity";
import { CalendarIcon } from "@sanity/icons";

export default defineType({
  name: "tableSchedule",
  title: "テーブルスケジュール",
  type: "object",
  description: "列・行のシンプルなテーブル形式（曜日ベースやイベント一覧など）。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "テーブルスケジュール",
      subtitle: title?.find((t) => t._key === "en")?.value || "Table Schedule",
      media: CalendarIcon,
    }),
  },
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "テーブルの見出し。省略可。",
      hidden: ({ parent }) => parent?.hideTitle,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { hideTitle?: boolean } | undefined;
          if (parent?.hideTitle) return true;
          const hasValue = Array.isArray(value) && value.some((v: { value?: string }) => v.value?.trim());
          return hasValue ? true : "タイトルが未入力です。省略する場合は「タイトルなし」にチェックしてください。";
        }),
    }),
    defineField({
      name: "hideTitle",
      title: "タイトルなし",
      type: "boolean",
      description: "チェックするとタイトルを省略できます。",
      initialValue: false,
    }),
    defineField({
      name: "columns",
      title: "列見出し（日本語）",
      type: "array",
      of: [{ type: "string" }],
      description: "テーブルの列名（日本語）。",
    }),
    defineField({
      name: "columnsEn",
      title: "列見出し（英語）",
      type: "array",
      of: [{ type: "string" }],
      description: "テーブルの列名（英語）。",
    }),
    defineField({
      name: "rows",
      title: "行",
      description: "各行のセルを配列で入力。",
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
              description: "この行の各セルの値。列の順番に対応します。",
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
