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
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "リンクセクションの見出し。省略可。",
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
