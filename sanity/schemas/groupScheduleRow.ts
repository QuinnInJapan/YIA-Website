import { defineType, defineField } from "sanity";

export default defineType({
  name: "groupScheduleRow",
  title: "グループスケジュール行",
  type: "object",
  fields: [
    defineField({ name: "name", title: "名前", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
    defineField({ name: "day", title: "曜日", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "time", title: "時間", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "location", title: "場所", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "timeSlot",
      title: "時間帯",
      type: "string",
      options: {
        list: [
          { title: "午前", value: "morning" },
          { title: "午後", value: "afternoon" },
          { title: "夜", value: "evening" },
          { title: "週末", value: "weekend" },
        ],
      },
    }),
    defineField({ name: "schedulePdf", title: "スケジュールPDF", type: "file" }),
    defineField({ name: "photosPdf", title: "写真PDF", type: "file" }),
    defineField({ name: "website", title: "ウェブサイト", type: "url" }),
  ],
});
