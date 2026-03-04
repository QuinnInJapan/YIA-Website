import { defineType, defineField } from "sanity";
import { DocumentsIcon } from "@sanity/icons";

export default defineType({
  name: "documents",
  title: "資料セクション",
  type: "object",
  preview: {
    select: { title: "titleJa", subtitle: "titleEn" },
    prepare: ({ title, subtitle }: { title?: string; subtitle?: string }) => ({
      title: title || "資料セクション",
      subtitle: subtitle || "Documents",
      media: DocumentsIcon,
    }),
  },
  fields: [
    defineField({ name: "titleJa", title: "タイトル（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "titleEn", title: "タイトル（英語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "items",
      title: "項目",
      type: "array",
      of: [{ type: "documentLink" }],
      validation: (Rule) => Rule.required(),
    }),
  ],
});
