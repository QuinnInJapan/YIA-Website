import { defineType, defineField } from "sanity";
import { EarthGlobeIcon } from "@sanity/icons";

export default defineType({
  name: "sisterCities",
  title: "姉妹都市セクション",
  type: "object",
  preview: {
    select: { title: "titleJa", subtitle: "titleEn" },
    prepare: ({ title, subtitle }: { title?: string; subtitle?: string }) => ({
      title: title || "姉妹都市セクション",
      subtitle: subtitle || "Sister Cities",
      media: EarthGlobeIcon,
    }),
  },
  fields: [
    defineField({ name: "titleJa", title: "タイトル（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "titleEn", title: "タイトル（英語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "cities",
      title: "都市",
      type: "array",
      of: [{ type: "sisterCity" }],
      validation: (Rule) => Rule.required(),
    }),
  ],
});
