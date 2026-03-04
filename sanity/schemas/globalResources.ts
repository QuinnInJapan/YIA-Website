import { defineType, defineField } from "sanity";

export default defineType({
  name: "globalResources",
  title: "共通リソース",
  type: "document",
  preview: {
    prepare: () => ({ title: "共通リソース" }),
  },
  fields: [
    defineField({
      name: "accessMap",
      title: "アクセスマップ",
      type: "object",
      fields: [
        defineField({ name: "image", title: "画像", type: "string" }),
        defineField({ name: "labelJa", title: "ラベル（日本語）", type: "string" }),
        defineField({ name: "labelEn", title: "ラベル（英語）", type: "string" }),
      ],
    }),
    defineField({
      name: "youtubeLink",
      title: "YouTubeリンク",
      type: "object",
      fields: [
        defineField({ name: "url", title: "URL", type: "string" }),
        defineField({ name: "labelJa", title: "ラベル（日本語）", type: "string" }),
        defineField({ name: "labelEn", title: "ラベル（英語）", type: "string" }),
      ],
    }),
    defineField({ name: "counselingImage", title: "相談窓口画像", type: "string" }),
    defineField({
      name: "memberRecruitment",
      title: "会員募集",
      type: "object",
      fields: [
        defineField({ name: "labelJa", title: "ラベル（日本語）", type: "string" }),
        defineField({ name: "labelEasy", title: "ラベル（やさしい日本語）", type: "string" }),
        defineField({ name: "labelEn", title: "ラベル（英語）", type: "string" }),
        defineField({ name: "url", title: "URL", type: "string" }),
      ],
    }),
    defineField({
      name: "activityRequestForm",
      title: "活動依頼書",
      type: "documentLink",
    }),
    defineField({
      name: "fairTrade",
      title: "フェアトレード",
      type: "object",
      fields: [
        defineField({ name: "labelJa", title: "ラベル（日本語）", type: "string" }),
        defineField({ name: "labelEn", title: "ラベル（英語）", type: "string" }),
      ],
    }),
    defineField({
      name: "resourceBoxes",
      title: "リソースボックス",
      type: "array",
      of: [{ type: "resourceBox" }],
    }),
    defineField({
      name: "documents",
      title: "資料",
      type: "array",
      of: [{ type: "documentLink" }],
    }),
  ],
});
