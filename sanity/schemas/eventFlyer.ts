import { defineType, defineField } from "sanity";

export default defineType({
  name: "eventFlyer",
  title: "イベントチラシ",
  type: "object",
  fields: [
    defineField({ name: "image", title: "画像", type: "string" }),
    defineField({ name: "imageJa", title: "画像（日本語）", type: "string" }),
    defineField({ name: "imageEn", title: "画像（英語）", type: "string" }),
    defineField({ name: "alt", title: "代替テキスト", type: "string" }),
    defineField({ name: "altJa", title: "代替テキスト（日本語）", type: "string" }),
    defineField({ name: "altEn", title: "代替テキスト（英語）", type: "string" }),
  ],
});
