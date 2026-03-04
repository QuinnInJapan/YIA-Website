import { defineType, defineField } from "sanity";
import { CalendarIcon } from "@sanity/icons";

export default defineType({
  name: "schedule",
  title: "スケジュールセクション",
  type: "object",
  preview: {
    select: { title: "titleJa", subtitle: "titleEn" },
    prepare: ({ title, subtitle }: { title?: string; subtitle?: string }) => ({
      title: title || "スケジュールセクション",
      subtitle: subtitle || "Schedule",
      media: CalendarIcon,
    }),
  },
  fields: [
    defineField({ name: "titleJa", title: "タイトル（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "titleEn", title: "タイトル（英語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "subtype", title: "サブタイプ", type: "string" }),
    defineField({
      name: "scheduleType",
      title: "スケジュール種別",
      type: "string",
      options: {
        list: [
          { title: "週間", value: "weekly" },
          { title: "グループ", value: "group" },
          { title: "イベント", value: "event" },
        ],
      },
    }),
    defineField({
      name: "columns",
      title: "列",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "columnsEn",
      title: "列（英語）",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "rows",
      title: "行（JSON）",
      description: "シンプルなテーブル行のJSON配列",
      type: "text",
    }),
    defineField({
      name: "groupRows",
      title: "グループ行",
      type: "array",
      of: [{ type: "groupScheduleRow" }],
    }),
    defineField({
      name: "entries",
      title: "エントリー",
      type: "array",
      of: [{ type: "scheduleDateEntry" }],
    }),
    defineField({
      name: "entry",
      title: "エントリー",
      type: "object",
      fields: [
        defineField({ name: "date", title: "日付", type: "date", validation: (Rule) => Rule.required() }),
        defineField({ name: "time", title: "時間", type: "string" }),
      ],
    }),
    defineField({
      name: "venue",
      title: "会場",
      type: "object",
      fields: [
        defineField({ name: "locationJa", title: "場所（日本語）", type: "string", validation: (Rule) => Rule.required() }),
        defineField({ name: "locationEn", title: "場所（英語）", type: "string" }),
      ],
    }),
  ],
});
