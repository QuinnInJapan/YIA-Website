import { defineType, defineField } from "sanity";
import { MenuIcon } from "@sanity/icons";

export default defineType({
  name: "navigation",
  title: "ナビゲーション",
  type: "document",
  icon: MenuIcon,
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
                  preview: {
                    select: { title: "title" },
                    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
                      title: title?.find((t) => t._key === "ja")?.value || "Untitled",
                    }),
                  },
                },
              ],
            }),
          ],
          preview: {
            select: { label: "categoryRef.label" },
            prepare: ({ label }: { label?: { _key: string; value: string }[] }) => ({
              title: label?.find((t) => t._key === "ja")?.value || "Untitled",
            }),
          },
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
          preview: {
            select: { title: "title" },
            prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
              title: title?.find((t) => t._key === "ja")?.value || "Untitled",
            }),
          },
        },
      ],
    }),
  ],
});
