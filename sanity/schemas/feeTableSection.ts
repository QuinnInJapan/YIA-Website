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
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。",
      validation: (Rule) => Rule.required(),
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
            defineField({ name: "fee", title: "会費", type: "string", description: "年会費の金額（例：¥3,000）。" }),
          ],
        },
      ],
      description: "会員種別と会費の一覧。",
    }),
  ],
});
