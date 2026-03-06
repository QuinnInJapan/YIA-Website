import { defineType, defineField } from "sanity";
import { LinkIcon } from "@sanity/icons";

export default defineType({
  name: "links",
  title: "リンクセクション",
  type: "object",
  description: "資料ダウンロード・YouTube・外部サイトなどのリンク一覧",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "リンクセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Links",
      media: LinkIcon,
    }),
  },
  fields: [
    defineField({ name: "title", title: "タイトル", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
    defineField({
      name: "items",
      title: "項目",
      type: "array",
      of: [{ type: "documentLink" }],
      validation: (Rule) => Rule.required(),
    }),
  ],
});
