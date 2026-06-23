import { defineType, defineField } from "sanity";
import { ThListIcon } from "@sanity/icons";
import { tocLevelField } from "./fields/tocLevelField";

export default defineType({
  name: "labelTable",
  title: "ラベルテーブルセクション",
  type: "object",
  description: "ラベル・値の定義リスト形式で情報を表示（開催日時、対象者、費用など）。",
  preview: {
    select: { title: "title" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "ラベルテーブルセクション",
      subtitle: title?.find((t) => t._key === "en")?.value || "Label Table",
      media: ThListIcon,
    }),
  },
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      description: "テーブルの見出し。省略可。",
    }),
    defineField({
      name: "prominent",
      title: "目立たせる（カード表示）",
      type: "boolean",
      description:
        "オンにすると、このテーブルを枠線付きカードとして強調表示します。「ご利用案内」など、特に目立たせたい重要な案内に使用してください。",
      initialValue: false,
    }),
    tocLevelField,
    defineField({
      name: "rows",
      title: "行",
      type: "array",
      of: [{ type: "infoRow" }],
      description: "テーブルの行。各行はラベルと値のペアです。",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
