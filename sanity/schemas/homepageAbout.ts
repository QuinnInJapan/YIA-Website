import { defineType, defineField } from "sanity";
import { InfoOutlineIcon } from "@sanity/icons";

/**
 * Standalone singleton for the "About YIA" homepage variant.
 * Kept separate from the main homepage schema so it can be
 * deleted or folded in later without touching existing fields.
 */
export default defineType({
  name: "homepageAbout",
  title: "ホームページ「YIAについて」",
  type: "document",
  icon: InfoOutlineIcon,
  preview: {
    prepare: () => ({ title: "ホームページ「YIAについて」セクション" }),
  },
  fields: [
    defineField({
      name: "image",
      title: "写真",
      type: "image",
      options: { hotspot: true },
      description: "「YIAについて」セクションに表示する団体写真。",
      validation: (Rule) => Rule.required().error("写真は必須です"),
    }),
    defineField({
      name: "imageAlt",
      title: "写真の代替テキスト",
      type: "internationalizedArrayString",
      description: "写真の説明（アクセシビリティ用）。",
    }),
    defineField({
      name: "bodyJa",
      title: "本文（日本語）",
      type: "text",
      rows: 5,
      description: "日本語の紹介文。",
      validation: (Rule) => Rule.required().error("日本語の本文は必須です"),
    }),
    defineField({
      name: "bodyEn",
      title: "本文（English）",
      type: "text",
      rows: 5,
      description: "英語の紹介文。",
      validation: (Rule) => Rule.required().error("英語の本文は必須です"),
    }),
  ],
});
