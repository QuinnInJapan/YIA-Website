import { defineType, defineField } from "sanity";
import { ThListIcon } from "@sanity/icons";

export default defineType({
  name: "infoTable",
  title: "情報テーブルセクション",
  type: "object",
  description: "ラベル・値の定義リスト形式で情報を表示（開催日時、対象者、費用など）",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "情報テーブルセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Info Table",
      media: ThListIcon,
    }),
  },
  fields: [
    defineField({ name: "title", title: "タイトル", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
    defineField({
      name: "rows",
      title: "行",
      type: "array",
      of: [{ type: "infoRow" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "appointmentNote", title: "予約についての注意", type: "internationalizedArrayString" }),
    defineField({ name: "additionalLanguageNote", title: "追加言語の注意", type: "internationalizedArrayString" }),
    defineField({ name: "otherNotes", title: "その他の注意", type: "internationalizedArrayString" }),
  ],
});
