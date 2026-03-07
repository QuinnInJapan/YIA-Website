import { defineType, defineField } from "sanity";

export default defineType({
  name: "sisterCity",
  title: "姉妹都市",
  type: "object",
  description: "姉妹都市の情報カード。",
  preview: {
    select: {
      name: "name",
      country: "country",
      media: "image",
    },
    prepare: ({ name, country, media }) => ({
      title: name?.find((n: { _key: string; value: string }) => n._key === "ja")?.value || "姉妹都市",
      subtitle: country?.find((c: { _key: string; value: string }) => c._key === "en")?.value || country?.find((c: { _key: string; value: string }) => c._key === "ja")?.value,
      media,
    }),
  },
  fields: [
    defineField({
      name: "name",
      title: "名前",
      type: "internationalizedArrayString",
      description: "姉妹都市の名前。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "country",
      title: "国",
      type: "internationalizedArrayString",
      description: "姉妹都市がある国の名前。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "画像",
      type: "image",
      description: "姉妹都市の写真または国旗。カードに表示されます。",
    }),
    defineField({
      name: "note",
      title: "備考",
      type: "string",
      description: "提携年など補足情報（任意）。",
    }),
  ],
});
