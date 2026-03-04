import { defineType, defineField } from "sanity";

export default defineType({
  name: "homepage",
  title: "ホームページ",
  type: "document",
  preview: {
    prepare: () => ({ title: "ホームページ" }),
  },
  fields: [
    defineField({ name: "slug", title: "スラッグ", type: "string", hidden: true }),
    defineField({ name: "template", title: "テンプレート", type: "string", hidden: true }),
    defineField({
      name: "hero",
      title: "ヒーロー",
      type: "object",
      fields: [
        defineField({ name: "image", title: "画像", type: "string" }),
        defineField({ name: "tagline", title: "キャッチコピー", type: "internationalizedArrayString" }),
      ],
    }),
    defineField({
      name: "activityGrid",
      title: "活動グリッド",
      type: "object",
      fields: [
        defineField({
          name: "images",
          title: "画像",
          type: "array",
          of: [{ type: "string" }],
        }),
        defineField({
          name: "stat",
          title: "統計",
          type: "object",
          fields: [
            defineField({ name: "value", title: "値", type: "number" }),
            defineField({ name: "label", title: "ラベル", type: "internationalizedArrayString" }),
          ],
        }),
      ],
    }),
    defineField({
      name: "announcementRefs",
      title: "お知らせ",
      type: "array",
      of: [{ type: "reference", to: [{ type: "announcement" }] }],
    }),
    defineField({
      name: "eventFlyers",
      title: "イベントチラシ",
      type: "array",
      of: [{ type: "eventFlyer" }],
    }),
  ],
});
