import { defineType, defineField } from "sanity";

export default defineType({
  name: "linkItem",
  title: "リンク項目",
  type: "object",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "Untitled",
    }),
  },
  fields: [
    defineField({ name: "title", title: "タイトル", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
    defineField({ name: "url", title: "URL", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "type",
      title: "種類",
      type: "string",
      options: {
        list: [
          { title: "資料", value: "document" },
          { title: "YouTube", value: "youtube" },
          { title: "ウェブサイト", value: "website" },
        ],
      },
    }),
    defineField({
      name: "fileType",
      title: "ファイル種類",
      type: "string",
      description: "PDF, DOC, XLS など",
    }),
  ],
});
