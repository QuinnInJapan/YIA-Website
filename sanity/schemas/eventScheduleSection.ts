import { defineType, defineField } from "sanity";
import { CalendarIcon } from "@sanity/icons";

export default defineType({
  name: "eventSchedule",
  title: "イベントスケジュール",
  type: "object",
  description: "日付ベースのイベント日程（単発イベントまたは複数回開催）",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "イベントスケジュール",
      subtitle: title?.find((t) => t._key === "en")?.value || "Event Schedule",
      media: CalendarIcon,
    }),
  },
  fields: [
    defineField({ name: "title", title: "タイトル", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
    defineField({
      name: "entries",
      title: "エントリー",
      description: "複数日程の場合",
      type: "array",
      of: [{ type: "scheduleDateEntry" }],
    }),
    defineField({
      name: "entry",
      title: "単発エントリー",
      description: "単発イベントの場合",
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
        defineField({ name: "location", title: "場所", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
      ],
    }),
  ],
});
