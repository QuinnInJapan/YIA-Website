import { defineType, defineField } from "sanity";
import { LinkIcon } from "@sanity/icons";

export default defineType({
  name: "documentLink",
  title: "資料リンク",
  type: "object",
  description: "PDFファイルのアップロードまたは外部サイトへのリンク。",
  preview: {
    select: { label: "label", type: "type", fileType: "fileType" },
    prepare: ({ label, type, fileType }: { label?: { _key: string; value: string }[]; type?: string; fileType?: string }) => ({
      title: label?.find((l) => l._key === "ja")?.value || "Untitled",
      subtitle: [type, fileType].filter(Boolean).join(" · ") || undefined,
      media: LinkIcon,
    }),
  },
  validation: (Rule) =>
    Rule.custom((value: Record<string, unknown> | undefined) => {
      if (!value) return true;
      const hasFile = value.file;
      const hasUrl = value.url;
      return hasFile || hasUrl ? true : "ファイルまたはURLのどちらかを設定してください";
    }),
  fields: [
    defineField({
      name: "label",
      title: "ラベル",
      type: "internationalizedArrayString",
      description: "リンクの表示名。サイト上でリンクテキストとして表示されます。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "file",
      title: "ファイル",
      type: "file",
      description: "アップロードファイル（PDF等）。外部リンクの場合は空のままにしてください。",
    }),
    defineField({
      name: "url",
      title: "外部URL",
      type: "url",
      description: "外部リンク先のURL。ファイルをアップロードした場合は不要です。",
    }),
    defineField({
      name: "type",
      title: "種類",
      type: "string",
      description: "リンクの種類。サイト上でアイコンの表示に使用されます。",
      options: {
        list: [
          { title: "資料", value: "document" },
          { title: "YouTube", value: "youtube" },
          { title: "ウェブサイト", value: "website" },
        ],
      },
    }),
    defineField({
      name: "fileType",
      title: "ファイル種類",
      type: "string",
      description: "ファイルの拡張子（PDF, DOC, XLS など）。リンクの横に表示されます。",
    }),
  ],
});
