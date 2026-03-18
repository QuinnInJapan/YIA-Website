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
      name: "documents",
      title: "資料",
      type: "array",
      of: [{ type: "documentLink" }],
      description: "サイドバーに表示する資料リンク。",
    }),
  ],
});
