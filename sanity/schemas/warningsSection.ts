import { defineType, defineField } from "sanity";
import { WarningOutlineIcon } from "@sanity/icons";

export default defineType({
  name: "warnings",
  title: "注意事項セクション",
  type: "object",
  description: "ページ上部に黄色背景で表示する注意事項・警告メッセージ。",
  preview: {
    select: { items: "items" },
    prepare: ({ items }) => ({
      title: `注意事項（${items?.length || 0}件）`,
      subtitle: "Warnings",
      media: WarningOutlineIcon,
    }),
  },
  fields: [
    defineField({
      name: "items",
      title: "項目",
      type: "array",
      of: [{ type: "internationalizedArrayText" }],
      description: "注意事項の一覧。各項目が1つの警告メッセージとして表示されます。",
    }),
  ],
});
