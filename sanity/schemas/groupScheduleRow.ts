import { defineType, defineField } from "sanity";

export default defineType({
  name: "groupScheduleRow",
  title: "グループスケジュール行",
  type: "object",
  description: "グループ活動の1行分の情報（名前・曜日・時間・場所）。",
  preview: {
    select: { name: "name", day: "day", time: "time" },
    prepare: ({ name, day, time }: { name?: { _key: string; value: string }[]; day?: string; time?: string }) => ({
      title: name?.find((n) => n._key === "ja")?.value || "",
      subtitle: [day, time].filter(Boolean).join(" "),
    }),
  },
  fields: [
    defineField({
      name: "name",
      title: "名前",
      type: "internationalizedArrayString",
      description: "グループの名前（例：日本語教室A）。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "day",
      title: "曜日",
      type: "string",
      description: "活動曜日（例：月曜日）。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "time",
      title: "時間",
      type: "string",
      description: "活動時間（例：10:00〜12:00）。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "location",
      title: "場所",
      type: "string",
      description: "活動場所。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "timeSlot",
      title: "時間帯",
      type: "string",
      description: "スケジュール表での分類に使用されます。",
      options: {
        list: [
          { title: "午前", value: "morning" },
          { title: "午後", value: "afternoon" },
          { title: "夜", value: "evening" },
          { title: "週末", value: "weekend" },
        ],
      },
    }),
    defineField({
      name: "schedulePdf",
      title: "スケジュールPDF",
      type: "file",
      description: "このグループのスケジュール表PDF（任意）。",
    }),
    defineField({
      name: "photosPdf",
      title: "写真PDF",
      type: "file",
      description: "このグループの活動写真PDF（任意）。",
    }),
    defineField({
      name: "website",
      title: "ウェブサイト",
      type: "url",
      description: "このグループの外部ウェブサイト（任意）。",
    }),
  ],
});
