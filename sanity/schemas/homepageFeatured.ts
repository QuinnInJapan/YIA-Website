import { defineType, defineField } from "sanity";
import { StarIcon } from "@sanity/icons";

export default defineType({
  name: "homepageFeatured",
  title: "ホームページ注目カテゴリー",
  type: "document",
  icon: StarIcon,
  preview: {
    prepare: () => ({ title: "ホームページ注目カテゴリー" }),
  },
  fields: [
    defineField({
      name: "categories",
      title: "注目カテゴリー",
      type: "array",
      of: [{ type: "reference", to: [{ type: "category" }] }],
      validation: (Rule) => Rule.max(4),
      description:
        "ホームページに表示するカテゴリー（最大4件）。ナビゲーションの順序で表示されます。",
    }),
  ],
});
