import { defineType, defineField } from "sanity";
import { EarthGlobeIcon } from "@sanity/icons";

export default defineType({
  name: "sisterCities",
  title: "姉妹都市セクション",
  type: "object",
  description: "姉妹都市のカード一覧表示。各都市の写真・国名を表示します。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "姉妹都市セクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Sister Cities",
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
      description: "セクションの見出し。省略するとページ名のみが表示されます。",
      hidden: ({ parent }) => parent?.hideTitle,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { hideTitle?: boolean } | undefined;
          if (parent?.hideTitle) return true;
          const hasValue = Array.isArray(value) && value.some((v: { value?: string }) => v.value?.trim());
          return hasValue ? true : "タイトルが未入力です。省略する場合は「タイトルなし」にチェックしてください。";
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
      name: "cities",
      title: "都市",
      type: "array",
      of: [{ type: "sisterCity" }],
      description: "姉妹都市の一覧。各都市がカードとして表示されます。",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
