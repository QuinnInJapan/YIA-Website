import { defineType, defineField } from "sanity";
import { StarIcon } from "@sanity/icons";

export default defineType({
  name: "homepageFeatured",
  title: "ホームページ注目カテゴリ",
  type: "document",
  icon: StarIcon,
  preview: {
    prepare: () => ({ title: "ホームページ注目カテゴリ" }),
  },
  fields: [
    defineField({
      name: "categories",
      title: "注目カテゴリ",
      type: "array",
      of: [{ type: "reference", to: [{ type: "category" }] }],
      validation: (Rule) => Rule.min(4).max(4),
      description:
        "ホームページに表示するカテゴリ（ちょうど4件）。ナビゲーションの順序で表示されます。",
    }),
  ],
});
