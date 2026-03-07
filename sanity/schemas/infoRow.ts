import { defineType, defineField } from "sanity";

export default defineType({
  name: "infoRow",
  title: "情報行",
  type: "object",
  description: "情報テーブルの1行（ラベルと値のペア）。",
  preview: {
    select: { label: "label", value: "value" },
    prepare: ({ label, value }: { label?: { _key: string; value: string }[]; value?: { _key: string; value: string }[] }) => ({
      title: label?.find((l) => l._key === "ja")?.value || "",
      subtitle: value?.find((v) => v._key === "ja")?.value || "",
    }),
  },
  fields: [
    defineField({
      name: "label",
      title: "ラベル",
      type: "internationalizedArrayString",
      description: "項目名（例：日時、場所、対象者）。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "value",
      title: "値",
      type: "internationalizedArrayString",
      description: "項目の内容（例：毎週月曜日 10:00〜12:00）。",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
