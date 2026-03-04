import { defineType, defineField } from "sanity";

export default defineType({
  name: "sidebar",
  title: "サイドバー・フッター",
  type: "document",
  groups: [
    { name: "sidebar", title: "サイドバー", default: true },
    { name: "footer", title: "フッター" },
  ],
  preview: {
    prepare: () => ({ title: "サイドバー・フッター" }),
  },
  fields: [
    defineField({
      name: "accessMap",
      title: "アクセスマップ",
      type: "object",
      group: "sidebar",
      fields: [
        defineField({ name: "image", title: "画像", type: "string" }),
        defineField({ name: "label", title: "ラベル", type: "internationalizedArrayString" }),
      ],
    }),
    defineField({
      name: "youtubeLink",
      title: "YouTubeリンク",
      type: "object",
      group: "sidebar",
      fields: [
        defineField({ name: "url", title: "URL", type: "string" }),
        defineField({ name: "label", title: "ラベル", type: "internationalizedArrayString" }),
      ],
    }),
    defineField({ name: "counselingImage", title: "相談窓口画像", type: "string", group: "sidebar" }),
    defineField({
      name: "memberRecruitment",
      title: "会員募集",
      type: "object",
      group: "sidebar",
      fields: [
        defineField({ name: "label", title: "ラベル", type: "internationalizedArrayString" }),
        defineField({ name: "url", title: "URL", type: "string" }),
      ],
    }),
    defineField({
      name: "fairTrade",
      title: "フェアトレード",
      type: "object",
      group: "sidebar",
      fields: [
        defineField({ name: "label", title: "ラベル", type: "internationalizedArrayString" }),
      ],
    }),
    defineField({
      name: "resourceBoxes",
      title: "リソースボックス",
      type: "array",
      group: "sidebar",
      of: [{ type: "resourceBox" }],
    }),
    defineField({
      name: "activityRequestForm",
      title: "活動依頼書",
      type: "documentLink",
      group: "footer",
    }),
    defineField({
      name: "documents",
      title: "資料",
      type: "array",
      group: "footer",
      of: [{ type: "documentLink" }],
    }),
  ],
});
