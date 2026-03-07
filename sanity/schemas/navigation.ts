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
      description: "サイトのメインナビゲーション。カテゴリーごとにページを整理します。",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "categoryRef",
              title: "カテゴリー",
              type: "reference",
              to: [{ type: "category" }],
              description: "ナビゲーションのカテゴリー。",
            }),
            defineField({
              name: "items",
              title: "項目",
              type: "array",
              description: "このカテゴリーに表示するページの一覧。",
              of: [
                {
                  type: "object",
                  fields: [
                    defineField({
                      name: "pageRef",
                      title: "ページ",
                      type: "reference",
                      to: [{ type: "page" }],
                    }),
                  ],
                  preview: {
                    select: { title: "pageRef.title" },
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
  ],
});
