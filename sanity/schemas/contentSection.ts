import { defineType, defineField } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";

export default defineType({
  name: "content",
  title: "コンテンツセクション",
  type: "object",
  description: "汎用コンテンツブロック（説明文、情報テーブル、チェックリスト、資料リンクなど）",
  fieldsets: [
    {
      name: "extras",
      title: "追加コンテンツ",
      description: "テーブル、チェックリスト、資料、画像など（任意）",
      options: { collapsible: true, collapsed: true },
    },
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "コンテンツセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Content",
      media: DocumentTextIcon,
    }),
  },
  fields: [
    defineField({
      name: "id",
      title: "ID",
      type: "string",
      description: "セクションの識別子（変更するとページ内リンクが壊れます。管理者のみ変更可能）",
      readOnly: true,
    }),
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。ページ上で太字の見出しとして表示されます。",
      hidden: ({ parent }) => parent?.hideTitle,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { hideTitle?: boolean } | undefined;
          if (parent?.hideTitle) return true;
          const hasValue = Array.isArray(value) && value.some((v: { value?: string }) => v.value?.trim());
          return hasValue ? true : "タイトルが未入力です。省略する場合は「タイトルなし」にチェックしてください。";
        }),
    }),
    defineField({
      name: "hideTitle",
      title: "タイトルなし",
      type: "boolean",
      description: "チェックするとタイトルを省略できます。",
      initialValue: false,
    }),
    defineField({
      name: "description",
      title: "説明",
      type: "internationalizedArrayBlockContent",
      description: "セクションの本文。リッチテキストで書式設定やリンクを追加できます。",
    }),
    defineField({
      name: "infoTable",
      title: "情報テーブル",
      type: "array",
      fieldset: "extras",
      of: [{ type: "infoRow" }],
      description: "ラベルと値のペアで情報を表示（例：日時、場所、対象者など）。",
    }),
    defineField({
      name: "checklist",
      title: "チェックリスト",
      type: "array",
      fieldset: "extras",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "label", title: "ラベル", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
            defineField({ name: "note", title: "備考", type: "internationalizedArrayString" }),
          ],
        },
      ],
      description: "チェックマーク付きの項目一覧（例：持ち物リスト、必要書類など）。",
    }),
    defineField({
      name: "documents",
      title: "資料",
      type: "array",
      fieldset: "extras",
      of: [{ type: "documentLink" }],
      description: "ダウンロード用のPDFファイルや外部リンク。",
    }),
    defineField({
      name: "note",
      title: "備考",
      type: "internationalizedArrayBlockContent",
      fieldset: "extras",
      description: "セクション下部に小さく表示される補足情報。",
    }),
    defineField({
      name: "images",
      title: "画像",
      type: "array",
      fieldset: "extras",
      of: [{ type: "imageFile" }],
      description: "セクション内に表示する画像。",
    }),
    defineField({
      name: "schedule",
      title: "スケジュール",
      type: "array",
      fieldset: "extras",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "city", title: "都市", type: "string", validation: (Rule) => Rule.required() }),
            defineField({ name: "period", title: "期間", type: "string", validation: (Rule) => Rule.required() }),
          ],
        },
      ],
      description: "都市ごとの派遣スケジュール（姉妹都市交流など）。",
    }),
  ],
});
