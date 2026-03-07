import { defineType, defineField } from "sanity";
import { ImagesIcon } from "@sanity/icons";

export default defineType({
  name: "gallery",
  title: "ギャラリーセクション",
  type: "object",
  description: "写真ギャラリー。ページ幅いっぱいの画像を複数表示します。",
  preview: {
    select: { images: "images" },
    prepare: ({ images }) => ({
      title: `ギャラリー（${images?.length || 0}枚）`,
      subtitle: "Gallery",
      media: ImagesIcon,
    }),
  },
  fields: [
    defineField({
      name: "images",
      title: "画像",
      type: "array",
      of: [{ type: "imageFile" }],
      description: "ギャラリーに表示する画像。ドラッグ＆ドロップで並び替えできます。",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
