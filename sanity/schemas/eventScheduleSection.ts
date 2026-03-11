import { defineType, defineField } from "sanity";
import { CalendarIcon } from "@sanity/icons";

export default defineType({
  name: "eventSchedule",
  title: "イベントスケジュール",
  type: "object",
  description: "日付ベースのイベント日程表示（単発イベントまたは複数回開催）。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "イベントスケジュール",
      subtitle: title?.find((t) => t._key === "en")?.value || "Event Schedule",
      media: CalendarIcon,
    }),
  },
  fieldsets: [
    {
      name: "advanced",
      title: "詳細設定",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "スケジュールの見出し。省略可。",
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
      fieldset: "advanced",
      title: "タイトルなし",
      type: "boolean",
      description: "チェックするとタイトルを省略できます。",
      initialValue: false,
    }),
    defineField({
      name: "entries",
      title: "エントリー",
      description: "複数日程の場合、各回の日程を追加してください。",
      type: "array",
      of: [{ type: "scheduleDateEntry" }],
    }),
    defineField({
      name: "entry",
      title: "単発エントリー",
      description: "1回のみ開催の場合はこちらに日時を入力してください。",
      type: "object",
      fields: [
        defineField({ name: "date", title: "日付", type: "date", validation: (Rule) => Rule.required() }),
        defineField({ name: "time", title: "時間", type: "string", description: "開催時間（例：14:00〜16:00）。" }),
      ],
    }),
    defineField({
      name: "venue",
      title: "会場",
      type: "object",
      description: "イベントの開催場所。",
      fields: [
        defineField({ name: "location", title: "場所", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
      ],
    }),
  ],
});
