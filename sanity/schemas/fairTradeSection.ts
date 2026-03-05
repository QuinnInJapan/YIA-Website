import { defineType, defineField } from "sanity";
import { BasketIcon } from "@sanity/icons";

export default defineType({
  name: "fairTrade",
  title: "フェアトレードセクション",
  type: "object",
  description: "フェアトレード商品の説明・価格表・配送情報",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "フェアトレードセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Fair Trade",
      media: BasketIcon,
    }),
  },
  fields: [
    defineField({ name: "title", title: "タイトル", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
    defineField({ name: "description", title: "説明", type: "internationalizedArrayBlockContent" }),
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
    defineField({ name: "delivery", title: "配送について", type: "internationalizedArrayBlockContent" }),
  ],
});
