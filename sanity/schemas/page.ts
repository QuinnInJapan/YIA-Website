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
    select: { title: "title", catLabel: "categoryRef.label" },
    prepare: ({ title, catLabel }: { title?: { _key: string; value: string }[]; catLabel?: { _key: string; value: string }[] }) => {
      const enTitle = title?.find((t) => t._key === "en")?.value;
      const catJa = catLabel?.find((t) => t._key === "ja")?.value;
      const parts = [catJa, enTitle].filter(Boolean);
      return {
        title: title?.find((t) => t._key === "ja")?.value || "Untitled",
        subtitle: parts.join(" · ") || undefined,
      };
    },
  },
  fields: [
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
      name: "categoryRef",
      title: "カテゴリー",
      type: "reference",
      to: [{ type: "category" }],
      group: "meta",
      description: "ナビゲーションから自動同期（手動変更不要）",
      readOnly: true,
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
