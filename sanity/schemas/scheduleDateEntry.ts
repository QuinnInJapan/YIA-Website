import { defineType, defineField } from "sanity";

export default defineType({
  name: "scheduleDateEntry",
  title: "スケジュール日程",
  type: "object",
  description: "イベントの1回分の日程情報。",
  preview: {
    select: { date: "date", time: "time", description: "description" },
    prepare: ({ date, time, description }: { date?: string; time?: string; description?: { _key: string; value: string }[] }) => ({
      title: date || "日付なし",
      subtitle: [time, description?.find((d) => d._key === "ja")?.value].filter(Boolean).join(" — "),
    }),
  },
  fields: [
    defineField({
      name: "date",
      title: "日付",
      type: "date",
      description: "開催日。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "time",
      title: "時間",
      type: "string",
      description: "開催時間（例：14:00〜16:00）。",
    }),
    defineField({
      name: "location",
      title: "場所",
      type: "internationalizedArrayString",
      description: "開催場所（通常の会場と異なる場合）。",
    }),
    defineField({
      name: "description",
      title: "説明",
      type: "internationalizedArrayString",
      description: "この回の補足説明（任意）。",
    }),
  ],
});
