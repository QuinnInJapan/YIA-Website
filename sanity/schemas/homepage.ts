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
      description: "ホームページ最上部のメインビジュアルとキャッチコピー。",
      fields: [
        defineField({
          name: "image",
          title: "画像",
          type: "image",
          options: { hotspot: true },
          description: "ホームページ上部の大きなメイン画像。推奨サイズ: 横1920px以上。",
          validation: (Rule) => Rule.required().error("ヒーロー画像は必須です"),
        }),
        defineField({
          name: "tagline",
          title: "キャッチコピー",
          type: "internationalizedArrayString",
          description: "ヒーロー画像の上に表示されるキャッチコピー。",
        }),
      ],
    }),
    defineField({
      name: "activityGrid",
      title: "活動グリッド",
      type: "object",
      group: "content",
      description: "活動写真と統計数値のグリッド表示。レイアウトに関わるため管理者のみ編集可能。",
      readOnly: true,
      fields: [
        defineField({
          name: "images",
          title: "画像",
          type: "array",
          of: [{ type: "image" }],
          description: "活動写真6枚。ホームページのグリッドに表示されます。",
        }),
        defineField({
          name: "stat",
          title: "統計",
          type: "object",
          description: "グリッド内に表示される統計数値（例：会員数）。",
          fields: [
            defineField({ name: "value", title: "値", type: "number", description: "表示する数値。" }),
            defineField({ name: "label", title: "ラベル", type: "internationalizedArrayString", description: "数値の下に表示されるラベル。" }),
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
      description: "ホームページに表示するお知らせを選択します。ここで選んだお知らせがトップページに表示されます。",
    }),
    defineField({
      name: "eventFlyers",
      title: "イベントチラシ",
      type: "array",
      group: "content",
      of: [{ type: "eventFlyer" }],
      description: "ホームページの「イベント」欄に表示するチラシ画像。新しいイベントのチラシに差し替えてください。",
    }),
  ],
});
