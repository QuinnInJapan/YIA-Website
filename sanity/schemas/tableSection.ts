// sanity/schemas/tableSection.ts
import { defineType, defineField } from "sanity";
import { ThLargeIcon } from "@sanity/icons";
import { tocLevelField } from "./fields/tocLevelField";

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
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "セクションの見出し。省略可。",
    }),
    tocLevelField,
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
                  { title: "リンク (hyperlink)", value: "hyperlink" },
                  { title: "ファイル (file)", value: "file" },
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
      name: "display",
      title: "表示形式",
      type: "string",
      options: {
        layout: "radio",
        list: [
          { title: "テーブル", value: "table" },
          { title: "比較テーブル", value: "comparisonTable" },
          { title: "スケジュールリスト", value: "scheduleList" },
          { title: "スケジュールディレクトリ", value: "scheduleDirectory" },
        ],
      },
      initialValue: "table",
      description: "列と行のデータはそのままに、公開ページでの表示形式だけを切り替えます。",
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
            defineField({
              name: "fileCells",
              title: "ファイルセル",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    defineField({ name: "colKey", title: "列キー", type: "string" }),
                    defineField({ name: "assetRef", title: "アセット参照", type: "string" }),
                    defineField({ name: "fileType", title: "ファイル種別", type: "string" }),
                    defineField({ name: "filename", title: "ファイル名", type: "string" }),
                  ],
                },
              ],
            }),
            defineField({
              name: "hyperlinkCells",
              title: "リンクセル",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    defineField({ name: "colKey", title: "列キー", type: "string" }),
                    defineField({
                      name: "href",
                      title: "URL",
                      type: "url",
                      validation: (Rule) =>
                        Rule.uri({
                          scheme: ["http", "https", "mailto", "tel"],
                        }),
                    }),
                  ],
                },
              ],
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
