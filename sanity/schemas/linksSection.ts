import { defineType, defineField } from "sanity";
import { LinkIcon } from "@sanity/icons";

export default defineType({
  name: "links",
  title: "リンクセクション",
  type: "object",
  description: "資料ダウンロード・YouTube・外部サイトなどのリンク一覧。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "リンクセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Links",
      media: LinkIcon,
    }),
  },
  fieldsets: [
    {
      name: "advanced",
      title: "詳細設定",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "リンクセクションの見出し。省略可。",
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
      fieldset: "advanced",
      title: "タイトルなし",
      type: "boolean",
      description: "チェックするとタイトルを省略できます。",
      initialValue: false,
    }),
    defineField({
      name: "items",
      title: "項目",
      type: "array",
      of: [{ type: "documentLink" }],
      description: "リンクの一覧。PDF・YouTube・外部サイトなどを追加できます。",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
