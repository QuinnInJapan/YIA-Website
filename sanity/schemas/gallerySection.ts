import { defineType, defineField } from "sanity";
import { ImagesIcon } from "@sanity/icons";

export default defineType({
  name: "gallery",
  title: "ギャラリーセクション",
  type: "object",
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
