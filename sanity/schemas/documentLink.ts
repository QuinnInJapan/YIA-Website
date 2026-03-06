import { defineType, defineField } from "sanity";

export default defineType({
  name: "documentLink",
  title: "資料リンク",
  type: "object",
  fields: [
    defineField({ name: "label", title: "ラベル", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
    defineField({ name: "file", title: "ファイル", type: "file", description: "アップロードファイル（PDF等）/ Upload file (PDF, etc.)" }),
    defineField({ name: "url", title: "外部URL", type: "url", description: "外部リンク（ファイルがない場合）/ External link (if no file uploaded)" }),
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
