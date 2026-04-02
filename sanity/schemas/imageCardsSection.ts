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
  fieldsets: [
    {
      name: "advanced",
      title: "詳細設定",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。省略可。",
      hidden: ({ parent }) => parent?.hideTitle,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { hideTitle?: boolean } | undefined;
          if (parent?.hideTitle) return true;
          const hasValue =
            Array.isArray(value) && value.some((v: { value?: string }) => v.value?.trim());
          return hasValue
            ? true
            : "タイトルが未入力です。省略する場合は「タイトルなし」にチェックしてください。";
        }),
    }),
    defineField({
      name: "hideTitle",
      fieldset: "advanced",
      title: "タイトルなし",
      type: "boolean",
      description: "チェックするとタイトルを省略できます。",
      initialValue: false,
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
