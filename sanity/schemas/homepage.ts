import { defineType, defineField } from "sanity";

export default defineType({
  name: "homepage",
  title: "ホームページ",
  type: "document",
  preview: {
    prepare: () => ({ title: "ホームページ" }),
  },
  fields: [
    defineField({ name: "slug", title: "スラッグ", type: "string" }),
    defineField({ name: "template", title: "テンプレート", type: "string" }),
    defineField({
      name: "hero",
      title: "ヒーロー",
      type: "object",
      fields: [
        defineField({ name: "image", title: "画像", type: "string" }),
        defineField({ name: "taglineJa", title: "キャッチコピー（日本語）", type: "string" }),
        defineField({ name: "taglineEn", title: "キャッチコピー（英語）", type: "string" }),
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
            defineField({ name: "labelJa", title: "ラベル（日本語）", type: "string" }),
            defineField({ name: "labelEn", title: "ラベル（英語）", type: "string" }),
          ],
        }),
      ],
    }),
    defineField({
      name: "announcementIds",
      title: "お知らせID",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "eventFlyers",
      title: "イベントチラシ",
      type: "array",
      of: [{ type: "eventFlyer" }],
    }),
  ],
});
