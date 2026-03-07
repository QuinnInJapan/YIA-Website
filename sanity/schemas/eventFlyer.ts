import { defineType, defineField } from "sanity";

export default defineType({
  name: "eventFlyer",
  title: "イベントチラシ",
  type: "object",
  description: "イベントチラシ画像。共通画像または日英別の画像を設定できます。",
  preview: {
    select: {
      alt: "alt",
      media: "image",
      mediaJa: "imageJa",
    },
    prepare: ({ alt, media, mediaJa }) => ({
      title: alt?.find((a: { _key: string; value: string }) => a._key === "ja")?.value || "チラシ",
      subtitle: alt?.find((a: { _key: string; value: string }) => a._key === "en")?.value,
      media: media || mediaJa,
    }),
  },
  validation: (Rule) =>
    Rule.custom((value: Record<string, unknown> | undefined) => {
      if (!value) return true;
      const hasImage = value.image || value.imageJa || value.imageEn;
      return hasImage ? true : "画像を少なくとも1つ設定してください（共通・日本語・英語のいずれか）";
    }),
  fields: [
    defineField({
      name: "image",
      title: "画像（共通）",
      type: "image",
      description: "日英共通のチラシ画像。日英別に設定する場合は下の欄を使用してください。",
    }),
    defineField({
      name: "imageJa",
      title: "画像（日本語）",
      type: "image",
      description: "日本語版のチラシ画像。共通画像より優先されます。",
    }),
    defineField({
      name: "imageEn",
      title: "画像（英語）",
      type: "image",
      description: "英語版のチラシ画像。共通画像より優先されます。",
    }),
    defineField({
      name: "alt",
      title: "代替テキスト",
      type: "internationalizedArrayString",
      description: "画像の説明テキスト。画像が表示できない場合や音声読み上げ時に使用されます。",
    }),
  ],
});
