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
    select: { title: "title", catLabel: "categoryRef.label", slug: "slug" },
    prepare: ({ title, catLabel, slug }: { title?: { _key: string; value: string }[]; catLabel?: { _key: string; value: string }[]; slug?: string }) => {
      const catJa = catLabel?.find((t) => t._key === "ja")?.value;
      const parts = [catJa, slug ? `/${slug}` : undefined].filter(Boolean);
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
      description: "このページのURL（変更するとリンクが壊れます。管理者のみ変更可能）",
      validation: (Rule) => Rule.required(),
      readOnly: true,
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
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      group: "content",
      description: "ページの見出し。ブラウザのタブにも表示されます。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "subtitle",
      title: "サブタイトル",
      type: "internationalizedArrayString",
      group: "content",
      description: "タイトルの下に小さく表示される補足テキスト（任意）。",
    }),
    defineField({
      name: "description",
      title: "説明",
      type: "internationalizedArrayBlockContent",
      group: "content",
      description: "ページ上部の説明文。リッチテキストで書式設定できます。",
    }),
    defineField({
      name: "images",
      title: "画像",
      type: "array",
      group: "content",
      of: [{ type: "imageFile" }],
      description: "ページ上部に表示する画像（任意）。",
    }),
    defineField({
      name: "sections",
      title: "セクション",
      type: "array",
      group: "sections",
      description: "ページの各セクション。追加・編集・並び替えができます。",
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
