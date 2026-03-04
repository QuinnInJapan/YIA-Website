import { defineType, defineField } from "sanity";
import { InfoOutlineIcon } from "@sanity/icons";

export default defineType({
  name: "otherNotes",
  title: "その他の注意セクション",
  type: "object",
  preview: {
    prepare: () => ({ title: "その他の注意セクション", subtitle: "Other Notes", media: InfoOutlineIcon }),
  },
  fields: [
    defineField({ name: "ja", title: "日本語", type: "text", validation: (Rule) => Rule.required() }),
    defineField({ name: "en", title: "英語", type: "text", validation: (Rule) => Rule.required() }),
  ],
});
