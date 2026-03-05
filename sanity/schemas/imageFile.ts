import { defineType, defineField } from "sanity";

export default defineType({
  name: "imageFile",
  title: "画像ファイル",
  type: "object",
  fields: [
    defineField({ name: "file", title: "ファイル", type: "image", validation: (Rule) => Rule.required() }),
    defineField({ name: "caption", title: "キャプション", type: "internationalizedArrayString" }),
  ],
});
