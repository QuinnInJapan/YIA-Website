import { defineType, defineField } from "sanity";
import { TagIcon } from "@sanity/icons";

export default defineType({
  name: "category",
  title: "カテゴリ",
  type: "document",
  icon: TagIcon,
  preview: {
    select: { title: "label" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "Untitled",
      subtitle: title?.find((t) => t._key === "en")?.value,
    }),
  },
  fields: [
    defineField({
      name: "label",
      title: "ラベル",
      type: "internationalizedArrayString",
      description: "カテゴリの表示名。ナビゲーションやページヘッダーに表示されます。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "説明文",
      type: "internationalizedArrayString",
      description: "ホームページのカテゴリ欄に表示される短い説明。",
    }),
    defineField({
      name: "heroImage",
      title: "ヒーロー画像",
      type: "image",
      options: { hotspot: true },
      description: "カテゴリページ上部の背景画像。ホームページの注目カードにも使用されます。",
    }),
  ],
});
