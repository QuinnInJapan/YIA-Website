// sanity/schemas/tableSection.ts
import { defineType, defineField } from "sanity";
import { ThLargeIcon } from "@sanity/icons";

export default defineType({
  name: "table",
  title: "テーブルセクション",
  type: "object",
  description: "カスタム列定義と任意の行グループ分けを持つ汎用テーブル。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "テーブルセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Table",
      media: ThLargeIcon,
    }),
  },
  fieldsets: [
    {
      name: "advanced",
      title: "詳細設定",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。省略可。",
      hidden: ({ parent }) => parent?.hideTitle,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { hideTitle?: boolean } | undefined;
          if (parent?.hideTitle) return true;
          const hasValue =
            Array.isArray(value) && value.some((v: { value?: string }) => v.value?.trim());
          return hasValue
            ? true
            : "タイトルが未入力です。省略する場合は「タイトルなし」にチェックしてください。";
        }),
    }),
    defineField({
      name: "hideTitle",
      fieldset: "advanced",
      title: "タイトルなし",
      type: "boolean",
      description: "チェックするとタイトルを省略できます。",
      initialValue: false,
    }),
    defineField({
      name: "caption",
      title: "キャプション",
      type: "internationalizedArrayString",
      description: "タイトル下に小さく表示する補足（例：「〇〇年〇月現在」）。任意。",
    }),
    defineField({
      name: "columns",
      title: "列定義",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "列見出し",
              type: "internationalizedArrayString",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "type",
              title: "列の種類",
              type: "string",
              options: {
                list: [
                  { title: "テキスト (text)", value: "text" },
                  { title: "日付 (date)", value: "date" },
                  { title: "電話番号 (phone)", value: "phone" },
                  { title: "URL (url)", value: "url" },
                  { title: "金額 (currency)", value: "currency" },
                  { title: "氏名 (name)", value: "name" },
                ],
              },
              initialValue: "text",
            }),
          ],
          preview: {
            select: { label: "label", type: "type" },
            prepare: ({
              label,
              type,
            }: {
              label?: { _key: string; value: string }[];
              type?: string;
            }) => ({
              title: label?.find((l) => l._key === "ja")?.value || "列",
              subtitle: type || "text",
            }),
          },
        },
      ],
      description: "テーブルの列定義。",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "rows",
      title: "行",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "groupLabel",
              title: "グループ見出し",
              type: "internationalizedArrayString",
              description: "入力するとこの行がグループ見出し行になります（データセルは不要）。",
            }),
            defineField({
              name: "cells",
              title: "セル",
              type: "array",
              of: [{ type: "internationalizedArrayString" }],
              description: "各列に対応するセルの値。グループ見出し行では省略可。",
            }),
          ],
          preview: {
            select: { groupLabel: "groupLabel", cells: "cells" },
            prepare: ({
              groupLabel,
              cells,
            }: {
              groupLabel?: { _key: string; value: string }[];
              cells?: unknown[];
            }) => ({
              title:
                groupLabel?.find((g) => g._key === "ja")?.value ??
                `行（${cells?.length ?? 0}セル）`,
            }),
          },
        },
      ],
      description: "テーブルの行データ。",
    }),
  ],
});
