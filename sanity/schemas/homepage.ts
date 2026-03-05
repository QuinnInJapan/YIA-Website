import { defineType, defineField } from "sanity";
import { HomeIcon } from "@sanity/icons";

export default defineType({
  name: "homepage",
  title: "ホームページ",
  type: "document",
  icon: HomeIcon,
  groups: [
    { name: "hero", title: "ヒーロー", default: true },
    { name: "content", title: "コンテンツ" },
  ],
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
      group: "hero",
      fields: [
        defineField({
          name: "image",
          title: "画像",
          type: "image",
          options: { hotspot: true },
        }),
        defineField({ name: "tagline", title: "キャッチコピー", type: "internationalizedArrayString" }),
      ],
    }),
    defineField({
      name: "activityGrid",
      title: "活動グリッド",
      type: "object",
      group: "content",
      fields: [
        defineField({
          name: "images",
          title: "画像",
          type: "array",
          of: [{ type: "image" }],
          description: "活動写真 6枚 / 6 activity photos",
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
      group: "content",
      of: [{ type: "reference", to: [{ type: "announcement" }] }],
      description: "ホームページに表示するお知らせ / Announcements shown on homepage",
    }),
    defineField({
      name: "eventFlyers",
      title: "イベントチラシ",
      type: "array",
      group: "content",
      of: [{ type: "eventFlyer" }],
      description: "現在のイベントチラシ / Current event flyers",
    }),
  ],
});
