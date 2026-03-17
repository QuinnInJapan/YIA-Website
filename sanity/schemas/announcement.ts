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
    select: {
      title: "title",
      date: "date",
      pinned: "pinned",
      image: "heroImage",
    },
    prepare: ({
      title,
      date,
      pinned,
      image,
    }: {
      title?: { _key: string; value: string }[];
      date?: string;
      pinned?: boolean;
      image?: unknown;
    }) => ({
      title: `${pinned ? "📌 " : ""}${title?.find((t) => t._key === "ja")?.value || "Untitled"}`,
      subtitle: date || "",
      media: image as React.ReactElement | undefined,
    }),
  },
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "お知らせのタイトル（日本語・英語）。",
      validation: (Rule) => Rule.required().error("タイトルは必須です"),
    }),
    defineField({
      name: "slug",
      title: "スラッグ",
      type: "slug",
      description: "URLに使用されるスラッグ。タイトルから自動生成できます。",
      options: {
        source: (doc: Record<string, unknown>) => {
          const title = doc.title as { _key: string; value: string }[] | undefined;
          return (
            title?.find((t) => t._key === "en")?.value ||
            title?.find((t) => t._key === "ja")?.value ||
            ""
          );
        },
        slugify: (input: string) =>
          input
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[&/\\#,+()$~%.'":*?<>{}!@^=;`[\]|]/g, "")
            .slice(0, 96),
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().error("スラッグは必須です"),
    }),
    defineField({
      name: "date",
      title: "日付",
      type: "date",
      description: "お知らせの日付。一覧ページでこの日付順に表示されます。",
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
      name: "heroImage",
      title: "ヒーロー画像",
      type: "image",
      description: "お知らせの上部とカードに表示される画像。",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "internationalizedArrayString",
          title: "代替テキスト",
          description: "画像の説明（アクセシビリティ用）。",
        }),
      ],
    }),
    defineField({
      name: "excerpt",
      title: "抜粋",
      type: "internationalizedArrayText",
      description: "一覧に表示される短い要約。省略時は本文から自動生成。",
    }),
    defineField({
      name: "body",
      title: "本文",
      type: "internationalizedArrayBlockContent",
      description: "お知らせの本文。リッチテキストで書式設定やリンクを追加できます。",
    }),
    defineField({
      name: "documents",
      title: "資料",
      type: "array",
      of: [{ type: "documentLink" }],
      description: "お知らせに添付するPDFや外部リンク（任意）。",
    }),
  ],
});
