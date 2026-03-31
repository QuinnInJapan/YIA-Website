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
      validation: (Rule) =>
        Rule.custom((categories: any[] | undefined) => {
          if (!categories) return true;
          const emptyCategories = categories.filter((cat) => {
            const visibleItems = (cat.items ?? []).filter((item: any) => !item.hidden);
            return visibleItems.length === 0;
          });
          if (emptyCategories.length > 0) {
            return {
              message:
                "表示可能なページがないカテゴリーがあります。(A category has no visible pages.)",
              level: "warning" as const,
            };
          }
          return true;
        }),
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
                    defineField({
                      name: "hidden",
                      title: "非表示",
                      type: "boolean",
                      initialValue: false,
                      description: "ナビゲーションに表示しない場合はオンにします。",
                    }),
                  ],
                  preview: {
                    select: { title: "pageRef.title", hidden: "hidden" },
                    prepare: ({
                      title,
                      hidden,
                    }: {
                      title?: { _key: string; value: string }[];
                      hidden?: boolean;
                    }) => ({
                      title: title?.find((t) => t._key === "ja")?.value || "Untitled",
                      subtitle: hidden ? "🚫 非表示" : undefined,
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
