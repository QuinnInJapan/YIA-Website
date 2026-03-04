import { defineType, defineField } from "sanity";
import { CalendarIcon } from "@sanity/icons";

export default defineType({
  name: "groupSchedule",
  title: "グループスケジュール",
  type: "object",
  description: "グループ別のスケジュール表示（名前・曜日・時間・場所など）",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "グループスケジュール",
      subtitle: title?.find((t) => t._key === "en")?.value || "Group Schedule",
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
      name: "groups",
      title: "グループ",
      type: "array",
      of: [{ type: "groupScheduleRow" }],
    }),
  ],
});
