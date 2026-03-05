import { defineType, defineField } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";

export default defineType({
  name: "page",
  title: "ページ",
  type: "document",
  icon: DocumentTextIcon,
  groups: [
    { name: "meta", title: "設定" },
    { name: "content", title: "コンテンツ", default: true },
    { name: "sections", title: "セクション" },
  ],
  preview: {
    select: { title: "title", category: "category" },
    prepare: ({ title, category }: { title?: { _key: string; value: string }[]; category?: string }) => {
      const categoryLabels: Record<string, string> = {
        shien: "支援事業",
        kehatsu: "啓発事業",
        kouryu: "交流事業",
        kokusaikoken: "国際貢献",
      };
      const enTitle = title?.find((t) => t._key === "en")?.value;
      const catLabel = category ? categoryLabels[category] : undefined;
      const parts = [catLabel, enTitle].filter(Boolean);
      return {
        title: title?.find((t) => t._key === "ja")?.value || "Untitled",
        subtitle: parts.join(" · ") || undefined,
      };
    },
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
    defineField({ name: "description", title: "説明", type: "internationalizedArrayBlockContent", group: "content" }),
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
      group: "sections",
      of: [
        "content",
        "infoTable",
        "links",
        "warnings",
        "gallery",
        "flyers",
        "eventSchedule",
        "groupSchedule",
        "tableSchedule",
        "definitions",
        "feeTable",
        "directoryList",
        "boardMembers",
        "fairTrade",
        "sisterCities",
        "history",
      ].map((type) => ({ type, options: { modal: { type: "fold" as const } } })),
    }),
  ],
});
