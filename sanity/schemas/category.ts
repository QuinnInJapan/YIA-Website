import { defineType, defineField } from "sanity";
import { TagIcon } from "@sanity/icons";

export default defineType({
  name: "category",
  title: "カテゴリー",
  type: "document",
  icon: TagIcon,
  preview: {
    select: { title: "label" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "Untitled",
      subtitle: title?.find((t) => t._key === "en")?.value,
    }),
  },
  fields: [
    defineField({
      name: "id",
      title: "ID",
      type: "string",
      validation: (Rule) => Rule.required(),
      readOnly: ({ document }) => !!document?._createdAt,
      description: "作成後は変更できません",
    }),
    defineField({ name: "label", title: "ラベル", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
    defineField({ name: "heroImage", title: "ヒーロー画像", type: "image" }),
  ],
});
