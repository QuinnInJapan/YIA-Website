import { defineType, defineField } from "sanity";
import { ImageIcon } from "@sanity/icons";

export default defineType({
  name: "flyers",
  title: "チラシセクション",
  type: "object",
  preview: {
    prepare: () => ({ title: "チラシセクション", subtitle: "Flyers", media: ImageIcon }),
  },
  fields: [
    defineField({
      name: "items",
      title: "項目",
      type: "array",
      of: [{ type: "eventFlyer" }],
      validation: (Rule) => Rule.required(),
    }),
  ],
});
