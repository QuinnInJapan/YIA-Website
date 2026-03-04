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
      title: "行（JSON）",
      description: "JSON形式の二次元配列（例: [[\"月\",\"10:00\",\"教室A\"],[\"水\",\"14:00\",\"教室B\"]]）",
      type: "text",
    }),
  ],
});
