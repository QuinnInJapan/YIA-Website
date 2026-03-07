import { defineType, defineField } from "sanity";
import { CalendarIcon } from "@sanity/icons";

export default defineType({
  name: "groupSchedule",
  title: "グループスケジュール",
  type: "object",
  description: "グループ別のスケジュール表（名前・曜日・時間・場所の一覧表）。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "グループスケジュール",
      subtitle: title?.find((t) => t._key === "en")?.value || "Group Schedule",
      media: CalendarIcon,
    }),
  },
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "スケジュール表の見出し。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "columns",
      title: "列見出し（日本語）",
      type: "array",
      of: [{ type: "string" }],
      description: "テーブルの列名（例：グループ名、曜日、時間、場所）。",
    }),
    defineField({
      name: "columnsEn",
      title: "列見出し（英語）",
      type: "array",
      of: [{ type: "string" }],
      description: "英語版の列名。",
    }),
    defineField({
      name: "groups",
      title: "グループ",
      type: "array",
      of: [{ type: "groupScheduleRow" }],
      description: "各グループの情報。表の各行になります。",
    }),
  ],
});
