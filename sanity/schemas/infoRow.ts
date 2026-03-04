import { defineType, defineField } from "sanity";

export default defineType({
  name: "infoRow",
  title: "情報行",
  type: "object",
  fields: [
    defineField({ name: "label", title: "ラベル", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
    defineField({ name: "value", title: "値", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
  ],
});
