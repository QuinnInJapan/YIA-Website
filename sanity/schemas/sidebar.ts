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
      fields: [
        defineField({ name: "label", title: "ラベル", type: "internationalizedArrayString" }),
        defineField({ name: "url", title: "URL", type: "url" }),
      ],
    }),
    defineField({
      name: "documents",
      title: "資料",
      type: "array",
      of: [{ type: "documentLink" }],
    }),
  ],
});
