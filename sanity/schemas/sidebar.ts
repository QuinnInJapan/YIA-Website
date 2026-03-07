import { defineType, defineField } from "sanity";
import { ComponentIcon } from "@sanity/icons";

export default defineType({
  name: "sidebar",
  title: "サイドバー・フッター",
  type: "document",
  icon: ComponentIcon,
  preview: {
    prepare: () => ({ title: "サイドバー・フッター" }),
  },
  fields: [
    defineField({
      name: "memberRecruitment",
      title: "会員募集",
      type: "object",
      description: "サイドバーに表示される会員募集バナー。",
      fields: [
        defineField({ name: "label", title: "ラベル", type: "internationalizedArrayString", description: "バナーに表示するテキスト。" }),
        defineField({ name: "page", title: "ページ", type: "reference", to: [{ type: "page" }], description: "クリック時のリンク先ページ。" }),
      ],
    }),
    defineField({
      name: "documents",
      title: "資料",
      type: "array",
      of: [{ type: "documentLink" }],
      description: "サイドバーに表示する資料リンク。",
    }),
  ],
});
