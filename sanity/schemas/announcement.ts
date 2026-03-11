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
  preview: {
    select: { title: "title", date: "date", pinned: "pinned" },
    prepare: ({ title, date, pinned }: { title?: { _key: string; value: string }[]; date?: string; pinned?: boolean }) => ({
      title: `${pinned ? "📌 " : ""}${title?.find((t) => t._key === "ja")?.value || "Untitled"}`,
      subtitle: date || "",
    }),
  },
  fieldsets: [
    {
      name: "attachments",
      title: "添付ファイル",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "date",
      title: "日付",
      type: "date",
      description: "お知らせの公開日。一覧ページでこの日付順に表示されます。",
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (Rule) => Rule.required().error("日付は必須です"),
    }),
    defineField({
      name: "pinned",
      title: "固定表示",
      type: "boolean",
      description: "オンにすると、お知らせ一覧とホームページの上部に常に表示されます。",
      initialValue: false,
    }),
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "お知らせのタイトル。一覧ページとホームページに表示されます。",
      validation: (Rule) => Rule.required().error("タイトルは必須です"),
    }),
    defineField({
      name: "content",
      title: "内容",
      type: "internationalizedArrayBlockContent",
      description: "お知らせの本文。リッチテキストで書式設定やリンクを追加できます。",
    }),
    defineField({
      name: "image",
      title: "画像",
      type: "image",
      fieldset: "attachments",
      description: "お知らせに添付する画像（任意）。詳細ページに表示されます。",
    }),
    defineField({
      name: "documents",
      title: "資料",
      type: "array",
      fieldset: "attachments",
      of: [{ type: "documentLink" }],
      description: "お知らせに添付するPDFや外部リンク（任意）。",
    }),
  ],
});
