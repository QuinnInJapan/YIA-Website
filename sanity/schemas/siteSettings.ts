import { defineType, defineField } from "sanity";

export default defineType({
  name: "siteSettings",
  title: "サイト設定",
  type: "document",
  preview: {
    select: { title: "org.nameJa" },
    prepare: ({ title }) => ({ title: title || "サイト設定" }),
  },
  fields: [
    defineField({
      name: "org",
      title: "団体情報",
      type: "object",
      fields: [
        defineField({ name: "designation", title: "法人格", type: "string" }),
        defineField({ name: "nameJa", title: "名称（日本語）", type: "string" }),
        defineField({ name: "nameEn", title: "名称（英語）", type: "string" }),
        defineField({ name: "abbreviation", title: "略称", type: "string" }),
        defineField({ name: "founded", title: "設立年", type: "string" }),
        defineField({ name: "npoEstablished", title: "NPO認証年", type: "string" }),
        defineField({ name: "lastUpdated", title: "最終更新日", type: "date" }),
        defineField({ name: "descriptionJa", title: "説明（日本語）", type: "string" }),
        defineField({ name: "descriptionEn", title: "説明（英語）", type: "string" }),
      ],
    }),
    defineField({
      name: "contact",
      title: "連絡先",
      type: "object",
      fields: [
        defineField({ name: "postalCode", title: "郵便番号", type: "string" }),
        defineField({ name: "addressJa", title: "住所（日本語）", type: "string" }),
        defineField({ name: "addressEn", title: "住所（英語）", type: "string" }),
        defineField({ name: "tel", title: "電話番号", type: "string" }),
        defineField({ name: "fax", title: "FAX", type: "string" }),
        defineField({ name: "email", title: "メール", type: "string" }),
        defineField({ name: "website", title: "ウェブサイト", type: "string" }),
        defineField({ name: "youtube", title: "YouTube", type: "string" }),
      ],
    }),
    defineField({
      name: "businessHours",
      title: "業務時間",
      type: "bilingualText",
    }),
    defineField({ name: "copyright", title: "著作権表示", type: "string" }),
    defineField({ name: "googleMapsEmbedUrl", title: "Googleマップ埋め込みURL", type: "string" }),
  ],
});
