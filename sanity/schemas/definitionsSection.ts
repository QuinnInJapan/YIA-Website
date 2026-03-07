import { defineType, defineField } from "sanity";
import { BookIcon } from "@sanity/icons";

export default defineType({
  name: "definitions",
  title: "用語定義セクション",
  type: "object",
  description: "用語と定義のカード形式一覧。用語集や概念の説明に使用します。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "用語定義セクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Definitions",
      media: BookIcon,
    }),
  },
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
      description: "チェックするとタイトルを省略できます。",
      initialValue: false,
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
