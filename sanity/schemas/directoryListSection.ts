import { defineType, defineField } from "sanity";
import { UlistIcon } from "@sanity/icons";

export default defineType({
  name: "directoryList",
  title: "一覧セクション",
  type: "object",
  description: "連絡先一覧（名称・電話番号・URLのリスト）。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "一覧セクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Directory List",
      media: UlistIcon,
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
      description: "セクションの見出し。省略するとページ名のみが表示されます。",
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
      title: "一覧",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "nameJa", title: "名前（日本語）", type: "string", description: "団体や施設の名前。" }),
            defineField({ name: "tel", title: "電話番号", type: "string", description: "電話番号（任意）。" }),
            defineField({ name: "url", title: "URL", type: "url", description: "ウェブサイトのURL（任意）。" }),
          ],
        },
      ],
      description: "連絡先の一覧。名前・電話番号・URLを入力できます。",
    }),
  ],
});
