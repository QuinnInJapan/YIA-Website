import { defineType, defineField } from "sanity";

export default defineType({
  name: "sisterCity",
  title: "姉妹都市",
  type: "object",
  fields: [
    defineField({ name: "name", title: "名前", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
    defineField({ name: "country", title: "国", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
    defineField({ name: "image", title: "画像", type: "image" }),
    defineField({ name: "note", title: "備考", type: "string" }),
  ],
});
