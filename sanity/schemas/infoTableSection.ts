import { defineType, defineField } from "sanity";
import { ThListIcon } from "@sanity/icons";

export default defineType({
  name: "infoTable",
  title: "情報テーブルセクション",
  type: "object",
  description: "ラベル・値の定義リスト形式で情報を表示（開催日時、対象者、費用など）。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "情報テーブルセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Info Table",
      media: ThListIcon,
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
      description: "テーブルの見出し。省略可。",
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
      name: "rows",
      title: "行",
      type: "array",
      of: [{ type: "infoRow" }],
      description: "テーブルの行。各行はラベルと値のペアです。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "appointmentNote",
      title: "予約についての注意",
      type: "internationalizedArrayString",
      description: "予約が必要な場合の注意書き（任意）。",
    }),
    defineField({
      name: "additionalLanguageNote",
      title: "追加言語の注意",
      type: "internationalizedArrayString",
      description: "対応言語に関する補足（任意）。",
    }),
    defineField({
      name: "otherNotes",
      title: "その他の注意",
      type: "internationalizedArrayString",
      description: "その他の補足事項（任意）。",
    }),
  ],
});
