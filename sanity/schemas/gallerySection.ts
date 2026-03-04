import { defineType, defineField } from "sanity";
import { ImagesIcon } from "@sanity/icons";

export default defineType({
  name: "gallery",
  title: "ギャラリーセクション",
  type: "object",
  description: "写真ギャラリー（ヒーロー幅以上の画像のみ表示）",
  preview: {
    prepare: () => ({ title: "ギャラリーセクション", subtitle: "Gallery", media: ImagesIcon }),
  },
  fields: [
    defineField({
      name: "images",
      title: "画像",
      type: "array",
      of: [{ type: "imageFile" }],
      validation: (Rule) => Rule.required(),
    }),
  ],
});
