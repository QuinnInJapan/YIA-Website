// sanity/schemas/contentSection.ts
import { defineType, defineField } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";

export default defineType({
  name: "content",
  title: "コンテンツセクション",
  type: "object",
  description: "汎用コンテンツブロック（説明文）",
  fieldsets: [
    {
      name: "advanced",
      title: "詳細設定",
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
      fieldset: "advanced",
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
          const hasValue =
            Array.isArray(value) && value.some((v: { value?: string }) => v.value?.trim());
          return hasValue
            ? true
            : "タイトルが未入力です。省略する場合は「タイトルなし」にチェックしてください。";
        }),
    }),
    defineField({
      name: "hideTitle",
      title: "タイトルなし",
      type: "boolean",
      fieldset: "advanced",
      description: "チェックするとタイトルを省略できます。",
      initialValue: false,
    }),
    defineField({
      name: "description",
      title: "説明",
      type: "internationalizedArrayText",
      description: "セクションの本文。",
    }),
  ],
});
