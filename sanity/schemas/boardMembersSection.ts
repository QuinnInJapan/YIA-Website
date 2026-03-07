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
      description: "セクションの見出し。",
      validation: (Rule) => Rule.required(),
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
