import { defineType, defineField } from "sanity";
import { BellIcon } from "@sanity/icons";

export default defineType({
  name: "announcement",
  title: "お知らせ",
  type: "document",
  icon: BellIcon,
  orderings: [
    {
      title: "日付（新しい順）",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
    {
      title: "日付（古い順）",
      name: "dateAsc",
      by: [{ field: "date", direction: "asc" }],
    },
  ],
  groups: [
    { name: "meta", title: "設定" },
    { name: "attachments", title: "添付" },
  ],
  preview: {
    select: { title: "title", subtitle: "date" },
    prepare: ({ title, subtitle }: { title?: { _key: string; value: string }[]; subtitle?: string }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "Untitled",
      subtitle,
    }),
  },
  fields: [
    defineField({ name: "date", title: "日付", type: "date", group: "meta" }),
    defineField({
      name: "pinned",
      title: "固定表示",
      type: "boolean",
      group: "meta",
      description: "トップに固定表示",
    }),
    defineField({ name: "title", title: "タイトル", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
    defineField({ name: "content", title: "内容", type: "internationalizedArrayBlockContent" }),
    defineField({
      name: "documents",
      title: "資料",
      type: "array",
      group: "attachments",
      of: [{ type: "documentLink" }],
    }),
    defineField({ name: "image", title: "画像", type: "image", group: "attachments" }),
  ],
});
