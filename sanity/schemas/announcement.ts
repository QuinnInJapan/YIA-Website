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
    prepare: ({
      title,
      date,
      pinned,
    }: {
      title?: { _key: string; value: string }[];
      date?: string;
      pinned?: boolean;
    }) => ({
      title: `${pinned ? "📌 " : ""}${title?.find((t) => t._key === "ja")?.value || "Untitled"}`,
      subtitle: date || "",
    }),
  },
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      validation: (Rule) => Rule.required().error("タイトルは必須です"),
    }),
    defineField({
      name: "slug",
      title: "スラッグ",
      type: "slug",
      options: {
        source: (doc: Record<string, unknown>) => {
          const title = doc.title as { _key: string; value: string }[] | undefined;
          return (
            title?.find((t) => t._key === "en")?.value ||
            title?.find((t) => t._key === "ja")?.value ||
            ""
          );
        },
      },
    }),
    defineField({
      name: "date",
      title: "日付",
      type: "date",
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (Rule) => Rule.required().error("日付は必須です"),
    }),
    defineField({
      name: "pinned",
      title: "固定表示",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "heroImage",
      title: "ヒーロー画像",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "excerpt",
      title: "抜粋",
      type: "internationalizedArrayText",
    }),
    defineField({
      name: "body",
      title: "本文",
      type: "internationalizedArrayBlockContent",
    }),
    defineField({
      name: "documents",
      title: "資料",
      type: "array",
      of: [{ type: "documentLink" }],
    }),
    // Legacy fields — kept for backward compatibility
    defineField({
      name: "content",
      title: "内容（旧）",
      type: "internationalizedArrayBlockContent",
      hidden: true,
    }),
    defineField({
      name: "image",
      title: "画像（旧）",
      type: "image",
      hidden: true,
    }),
  ],
});
