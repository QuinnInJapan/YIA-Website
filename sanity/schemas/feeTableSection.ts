import { defineType, defineField } from "sanity";
import { CreditCardIcon } from "@sanity/icons";

export default defineType({
  name: "feeTable",
  title: "会費表セクション",
  type: "object",
  description: "会費・料金のテーブル表示（種別・金額）",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "会費表セクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Fee Table",
      media: CreditCardIcon,
    }),
  },
  fields: [
    defineField({ name: "title", title: "タイトル", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
    defineField({
      name: "rows",
      title: "会費行",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "memberType", title: "種別", type: "internationalizedArrayString" }),
            defineField({ name: "fee", title: "会費", type: "string" }),
          ],
        },
      ],
    }),
  ],
});
