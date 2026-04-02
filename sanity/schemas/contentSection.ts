// sanity/schemas/contentSection.ts
import { defineType, defineField } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";

export default defineType({
  name: "content",
  title: "コンテンツセクション",
  type: "object",
  description: "汎用コンテンツブロック（説明文）",
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
    }),
    defineField({
      name: "description",
      title: "説明",
      type: "internationalizedArrayText",
      description: "セクションの本文。",
    }),
  ],
});
