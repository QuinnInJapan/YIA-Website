import { defineType, defineField } from "sanity";
import { BookIcon } from "@sanity/icons";

export default defineType({
  name: "infoCards",
  title: "情報カードセクション",
  type: "object",
  description: "用語と定義のカード形式一覧。用語集や概念の説明に使用します。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "情報カードセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Info Cards",
      media: BookIcon,
    }),
  },
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。省略可。",
    }),
    defineField({
      name: "items",
      title: "項目",
      type: "array",
      of: [{ type: "definition" }],
      description: "用語と定義のペア一覧。",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
