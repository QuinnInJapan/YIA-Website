import { defineType, defineField } from "sanity";
import { StarIcon } from "@sanity/icons";

/** One featured slot: a category + up to 4 highlighted pages. */
function featuredSlot(name: string, title: string) {
  return defineField({
    name,
    title,
    type: "object",
    fields: [
      defineField({
        name: "categoryRef",
        title: "カテゴリー",
        type: "reference",
        to: [{ type: "category" }],
        validation: (Rule) => Rule.required(),
        description: "このスロットに表示するカテゴリー。",
      }),
      defineField({
        name: "pages",
        title: "表示ページ",
        type: "array",
        of: [{ type: "reference", to: [{ type: "page" }] }],
        validation: (Rule) => Rule.max(4),
        description: "ホームページに表示するページ（最大4件）。",
      }),
    ],
  });
}

export default defineType({
  name: "homepageFeatured",
  title: "ホームページ注目カテゴリー",
  type: "document",
  icon: StarIcon,
  preview: {
    prepare: () => ({ title: "ホームページ注目カテゴリー" }),
  },
  fields: [
    featuredSlot("slot1", "スロット1"),
    featuredSlot("slot2", "スロット2"),
    featuredSlot("slot3", "スロット3"),
    featuredSlot("slot4", "スロット4"),
  ],
});
