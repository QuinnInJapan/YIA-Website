import { defineType, defineField } from "sanity";

export default defineType({
  name: "page",
  title: "ページ",
  type: "document",
  groups: [
    { name: "meta", title: "設定" },
    { name: "content", title: "コンテンツ", default: true },
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "Untitled",
      subtitle: title?.find((t) => t._key === "en")?.value,
    }),
  },
  fields: [
    defineField({ name: "id", title: "ID", type: "string", hidden: true }),
    defineField({
      name: "slug",
      title: "スラッグ",
      type: "string",
      group: "meta",
      description: "URLパス（例: aboutyia）",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "template", title: "テンプレート", type: "string", hidden: true }),
    defineField({
      name: "category",
      title: "カテゴリー",
      type: "string",
      group: "meta",
      options: {
        list: [
          { title: "支援事業", value: "shien" },
          { title: "啓発事業", value: "kehatsu" },
          { title: "交流事業", value: "kouryu" },
          { title: "国際貢献", value: "kokusaikoken" },
        ],
      },
    }),
    defineField({ name: "title", title: "タイトル", type: "internationalizedArrayString", group: "content", validation: (Rule) => Rule.required() }),
    defineField({ name: "subtitle", title: "サブタイトル", type: "internationalizedArrayString", group: "content" }),
    defineField({ name: "description", title: "説明", type: "internationalizedArrayText", group: "content" }),
    defineField({
      name: "images",
      title: "画像",
      type: "array",
      group: "content",
      of: [{ type: "imageFile" }],
    }),
    defineField({
      name: "sections",
      title: "セクション",
      type: "array",
      group: "content",
      of: [
        { type: "warnings" },
        { type: "content" },
        { type: "infoTable" },
        { type: "tableSchedule" },
        { type: "groupSchedule" },
        { type: "eventSchedule" },
        { type: "gallery" },
        { type: "sisterCities" },
        { type: "definitions" },
        { type: "links" },
        { type: "history" },
        { type: "fairTrade" },
        { type: "flyers" },
        { type: "boardMembers" },
        { type: "feeTable" },
        { type: "directoryList" },
      ],
    }),
  ],
});
