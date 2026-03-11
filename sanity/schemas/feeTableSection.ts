import { defineType, defineField } from "sanity";
import { CreditCardIcon } from "@sanity/icons";

export default defineType({
  name: "feeTable",
  title: "会費表セクション",
  type: "object",
  description: "会費表。会員種別ごとの年会費を表形式で表示します。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "会費表セクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Fee Table",
      media: CreditCardIcon,
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
      name: "rows",
      title: "会費行",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "memberType", title: "種別", type: "internationalizedArrayString", description: "会員種別（例：個人会員、法人会員）。" }),
            defineField({ name: "fee", title: "会費", type: "internationalizedArrayString", description: "年会費の金額（例：¥3,000 / ¥3,000）。" }),
            defineField({ name: "description", title: "説明", type: "internationalizedArrayString", description: "この会員種別の説明（任意）。" }),
          ],
        },
      ],
      description: "会員種別と会費の一覧。",
    }),
  ],
});
