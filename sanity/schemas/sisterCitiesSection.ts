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
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。",
      validation: (Rule) => Rule.required(),
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
