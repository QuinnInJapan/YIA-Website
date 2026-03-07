import { defineType, defineField } from "sanity";
import { ImageIcon } from "@sanity/icons";

export default defineType({
  name: "flyers",
  title: "チラシセクション",
  type: "object",
  description: "イベントチラシ画像の日英ペア表示。イベントページ等で使用します。",
  preview: {
    select: { items: "items" },
    prepare: ({ items }) => ({
      title: `チラシ（${items?.length || 0}件）`,
      subtitle: "Flyers",
      media: ImageIcon,
    }),
  },
  fields: [
    defineField({
      name: "items",
      title: "項目",
      type: "array",
      of: [{ type: "eventFlyer" }],
      description: "チラシ画像の一覧。各チラシには日英別の画像を設定できます。",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
