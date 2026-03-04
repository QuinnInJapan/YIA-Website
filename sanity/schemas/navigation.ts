import { defineType, defineField } from "sanity";

export default defineType({
  name: "navigation",
  title: "ナビゲーション",
  type: "document",
  preview: {
    prepare: () => ({ title: "ナビゲーション" }),
  },
  fields: [
    defineField({
      name: "categories",
      title: "カテゴリー",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "categoryRef",
              title: "カテゴリー",
              type: "reference",
              to: [{ type: "category" }],
            }),
            defineField({
              name: "items",
              title: "項目",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    defineField({ name: "id", title: "ID", type: "string" }),
                    defineField({
                      name: "pageRef",
                      title: "ページ",
                      type: "reference",
                      to: [{ type: "page" }],
                    }),
                    defineField({ name: "title", title: "タイトル", type: "internationalizedArrayString" }),
                  ],
                },
              ],
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "orgLinks",
      title: "団体リンク",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "id", title: "ID", type: "string" }),
            defineField({
              name: "pageRef",
              title: "ページ",
              type: "reference",
              to: [{ type: "page" }],
            }),
            defineField({ name: "title", title: "タイトル", type: "internationalizedArrayString" }),
          ],
        },
      ],
    }),
  ],
});
