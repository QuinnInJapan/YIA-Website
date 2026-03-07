import { defineType, defineField } from "sanity";

export default defineType({
  name: "imageFile",
  title: "画像ファイル",
  type: "object",
  description: "キャプション付きの画像。ページ内の画像表示に使用します。",
  preview: {
    select: {
      caption: "caption",
      media: "file",
    },
    prepare: ({ caption, media }) => ({
      title: caption?.find((c: { _key: string; value: string }) => c._key === "ja")?.value || "画像",
      subtitle: caption?.find((c: { _key: string; value: string }) => c._key === "en")?.value,
      media,
    }),
  },
  fields: [
    defineField({
      name: "file",
      title: "ファイル",
      type: "image",
      options: { hotspot: true },
      description: "画像ファイル。クリックしてアップロードまたはドラッグ＆ドロップ。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "caption",
      title: "キャプション",
      type: "internationalizedArrayString",
      description: "画像の下に表示されるキャプション（任意）。",
    }),
  ],
});
