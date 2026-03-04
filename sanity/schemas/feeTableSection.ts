import { defineType, defineField } from "sanity";
import { CreditCardIcon } from "@sanity/icons";

export default defineType({
  name: "feeTable",
  title: "会費表セクション",
  type: "object",
  preview: {
    select: { title: "titleJa", subtitle: "titleEn" },
    prepare: ({ title, subtitle }: { title?: string; subtitle?: string }) => ({
      title: title || "会費表セクション",
      subtitle: subtitle || "Fee Table",
      media: CreditCardIcon,
    }),
  },
  fields: [
    defineField({ name: "titleJa", title: "タイトル（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "titleEn", title: "タイトル（英語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "rows",
      title: "会費行",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "typeJa", title: "種別（日本語）", type: "string" }),
            defineField({ name: "typeEn", title: "種別（英語）", type: "string" }),
            defineField({ name: "fee", title: "会費", type: "string" }),
          ],
        },
      ],
    }),
  ],
});
