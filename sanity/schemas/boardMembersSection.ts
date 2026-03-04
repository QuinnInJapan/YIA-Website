import { defineType, defineField } from "sanity";
import { UsersIcon } from "@sanity/icons";

export default defineType({
  name: "boardMembers",
  title: "役員一覧セクション",
  type: "object",
  preview: {
    select: { title: "titleJa", subtitle: "titleEn" },
    prepare: ({ title, subtitle }: { title?: string; subtitle?: string }) => ({
      title: title || "役員一覧セクション",
      subtitle: subtitle || "Board Members",
      media: UsersIcon,
    }),
  },
  fields: [
    defineField({ name: "titleJa", title: "タイトル（日本語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "titleEn", title: "タイトル（英語）", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "asOf", title: "時点", type: "date" }),
    defineField({
      name: "members",
      title: "役員一覧",
      type: "array",
      of: [{ type: "boardMember" }],
    }),
  ],
});
