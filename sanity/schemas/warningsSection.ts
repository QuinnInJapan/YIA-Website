import { defineType, defineField } from "sanity";
import { WarningOutlineIcon } from "@sanity/icons";

export default defineType({
  name: "warnings",
  title: "注意事項セクション",
  type: "object",
  preview: {
    prepare: () => ({ title: "注意事項セクション", subtitle: "Warnings", media: WarningOutlineIcon }),
  },
  fields: [
    defineField({
      name: "items",
      title: "項目",
      type: "array",
      of: [{ type: "bilingualText" }],
    }),
  ],
});
