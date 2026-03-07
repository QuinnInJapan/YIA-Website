import { defineType, defineField } from "sanity";

export default defineType({
  name: "definition",
  title: "用語定義",
  type: "object",
  description: "用語とその定義のペア。用語定義セクション内で使用します。",
  preview: {
    select: { term: "term" },
    prepare: ({ term }: { term?: { _key: string; value: string }[] }) => ({
      title: term?.find((t) => t._key === "ja")?.value || "用語",
    }),
  },
  fields: [
    defineField({
      name: "term",
      title: "用語",
      type: "internationalizedArrayString",
      description: "定義する用語（例：在留資格、国際交流員）。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "definition",
      title: "定義",
      type: "internationalizedArrayString",
      description: "用語の説明文。",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
