import { defineType, defineField } from "sanity";
import { UsersIcon } from "@sanity/icons";

export default defineType({
  name: "boardMembers",
  title: "役員一覧セクション",
  type: "object",
  description: "役員名簿（名前・役職のグリッド表示）。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "役員一覧セクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Board Members",
      media: UsersIcon,
    }),
  },
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。省略するとページ名のみが表示されます。",
      hidden: ({ parent }) => parent?.hideTitle,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { hideTitle?: boolean } | undefined;
          if (parent?.hideTitle) return true;
          const hasValue = Array.isArray(value) && value.some((v: { value?: string }) => v.value?.trim());
          return hasValue ? true : "タイトルが未入力です。省略する場合は「タイトルなし」にチェックしてください。";
        }),
    }),
    defineField({
      name: "hideTitle",
      title: "タイトルなし",
      type: "boolean",
      description: "チェックするとタイトルを省略できます。",
      initialValue: false,
    }),
    defineField({
      name: "asOf",
      title: "時点",
      type: "date",
      description: "名簿の基準日（例：令和6年4月1日現在）。",
    }),
    defineField({
      name: "members",
      title: "役員一覧",
      type: "array",
      of: [{ type: "boardMember" }],
      description: "役員の一覧。名前と役職を入力してください。",
    }),
  ],
});
