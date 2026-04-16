import { defineType, defineField } from "sanity";
import { ComposeIcon } from "@sanity/icons";

export default defineType({
  name: "blogPost",
  title: "ブログ記事",
  type: "document",
  icon: ComposeIcon,
  orderings: [
    {
      title: "公開日（新しい順）",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
    {
      title: "公開日（古い順）",
      name: "publishedAtAsc",
      by: [{ field: "publishedAt", direction: "asc" }],
    },
  ],
  fieldsets: [
    {
      name: "attachments",
      title: "添付ファイル・関連記事",
      options: { collapsible: true, collapsed: true },
    },
  ],
  preview: {
    select: { title: "title", date: "publishedAt", image: "heroImage" },
    prepare: ({
      title,
      date,
      image,
    }: {
      title?: { _key: string; value: string }[];
      date?: string;
      image?: unknown;
    }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "Untitled",
      subtitle: date ? new Date(date).toLocaleDateString("ja-JP") : "下書き",
      media: image as React.ReactElement | undefined,
    }),
  },
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "ブログ記事のタイトル（日本語・英語）。",
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
      name: "author",
      title: "著者",
      type: "string",
      description: "記事の著者名（任意）。",
    }),
    defineField({
      name: "publishedAt",
      title: "公開日",
      type: "datetime",
      description: "記事の公開日時。一覧で新しい順に並びます。",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required().error("公開日は必須です"),
    }),
    defineField({
      name: "category",
      title: "カテゴリー",
      type: "internationalizedArrayString",
      description: "記事のカテゴリータグ（任意）。カード上にラベルとして表示されます。",
    }),
    defineField({
      name: "heroImage",
      title: "ヒーロー画像",
      type: "image",
      description: "記事の上部とカードに表示される画像。",
      options: { hotspot: true },
    }),
    defineField({
      name: "excerpt",
      title: "抜粋",
      type: "internationalizedArrayText",
      description: "一覧カードに表示される短い要約。省略時は本文から自動生成。",
    }),
    defineField({
      name: "body",
      title: "本文",
      type: "internationalizedArrayBlockContent",
      description: "記事の本文。リッチテキストで書式設定できます。",
      validation: (Rule) => Rule.required().error("本文は必須です"),
    }),
    defineField({
      name: "relatedPosts",
      title: "関連記事",
      type: "array",
      fieldset: "attachments",
      of: [{ type: "reference", to: [{ type: "blogPost" }] }],
      description: "記事の下部に表示される関連記事（任意）。",
    }),
    defineField({
      name: "documents",
      title: "資料",
      type: "array",
      fieldset: "attachments",
      of: [{ type: "documentLink" }],
      description: "記事に添付するPDFや外部リンク（任意）。",
    }),
  ],
});
