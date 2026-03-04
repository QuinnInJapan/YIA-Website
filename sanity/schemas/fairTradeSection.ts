import { defineType, defineField } from "sanity";
import { BasketIcon } from "@sanity/icons";

export default defineType({
  name: "fairTrade",
  title: "フェアトレードセクション",
  type: "object",
  preview: {
    select: { title: "titleJa", subtitle: "titleEn" },
    prepare: ({ title, subtitle }: { title?: string; subtitle?: string }) => ({
      title: title || "フェアトレードセクション",
      subtitle: subtitle || "Fair Trade",
      media: BasketIcon,
    }),
  },
  fields: [
    defineField({ name: "titleJa", title: "タイトル（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "titleEn", title: "タイトル（英語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "descriptionJa", title: "説明（日本語）", type: "text" }),
    defineField({ name: "descriptionEn", title: "説明（英語）", type: "text" }),
    defineField({
      name: "priceList",
      title: "価格表",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "type", title: "種類", type: "string", validation: (Rule) => Rule.required() }),
            defineField({ name: "weight", title: "重量", type: "string", validation: (Rule) => Rule.required() }),
            defineField({ name: "price", title: "価格", type: "string", validation: (Rule) => Rule.required() }),
          ],
        },
      ],
    }),
    defineField({ name: "deliveryJa", title: "配送について（日本語）", type: "text" }),
    defineField({ name: "deliveryEn", title: "配送について（英語）", type: "text" }),
  ],
});
