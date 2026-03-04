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
            defineField({ name: "categoryId", title: "カテゴリーID", type: "string" }),
            defineField({
              name: "items",
              title: "項目",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    defineField({ name: "id", title: "ID", type: "string" }),
                    defineField({ name: "pageRef", title: "ページ参照", type: "string" }),
                    defineField({ name: "titleJa", title: "タイトル（日本語）", type: "string" }),
                    defineField({ name: "titleEasy", title: "タイトル（やさしい日本語）", type: "string" }),
                    defineField({ name: "titleEn", title: "タイトル（英語）", type: "string" }),
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
            defineField({ name: "pageRef", title: "ページ参照", type: "string" }),
            defineField({ name: "titleJa", title: "タイトル（日本語）", type: "string" }),
            defineField({ name: "titleEn", title: "タイトル（英語）", type: "string" }),
          ],
        },
      ],
    }),
  ],
});
