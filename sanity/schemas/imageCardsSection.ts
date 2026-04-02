import { defineType, defineField } from "sanity";
import { EarthGlobeIcon } from "@sanity/icons";

export default defineType({
  name: "imageCards",
  title: "イメージカードセクション",
  type: "object",
  description: "画像付きカードの一覧表示。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "イメージカードセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Image Cards",
      media: EarthGlobeIcon,
    }),
  },
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。省略可。",
    }),
    defineField({
      name: "items",
      title: "アイテム",
      type: "array",
      of: [{ type: "sisterCity" }],
      description: "カードの一覧。",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
