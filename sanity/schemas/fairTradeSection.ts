import { defineType, defineField } from "sanity";
import { BasketIcon } from "@sanity/icons";

export default defineType({
  name: "fairTrade",
  title: "フェアトレードセクション",
  type: "object",
  description: "フェアトレード商品の説明・価格表・配送情報。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "フェアトレードセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Fair Trade",
      media: BasketIcon,
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
      title: "タイトルなし",
      type: "boolean",
      fieldset: "advanced",
      description: "チェックするとタイトルを省略できます。",
      initialValue: false,
    }),
    defineField({
      name: "description",
      title: "説明",
      type: "internationalizedArrayText",
      description: "フェアトレードについての説明文。",
    }),
    defineField({
      name: "priceList",
      title: "価格表",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "type", title: "種類", type: "string", description: "商品の種類（例：コーヒー）。", validation: (Rule) => Rule.required() }),
            defineField({ name: "weight", title: "重量", type: "string", description: "商品の重量（例：200g）。", validation: (Rule) => Rule.required() }),
            defineField({ name: "price", title: "価格", type: "string", description: "税込価格（例：¥800）。", validation: (Rule) => Rule.required() }),
          ],
        },
      ],
      description: "商品の種類・重量・価格の一覧。",
    }),
    defineField({
      name: "delivery",
      title: "配送について",
      type: "internationalizedArrayText",
      description: "配送方法や送料についての説明。",
    }),
  ],
});
