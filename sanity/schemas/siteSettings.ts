import { defineType, defineField } from "sanity";

export default defineType({
  name: "siteSettings",
  title: "サイト設定",
  type: "document",
  groups: [
    { name: "org", title: "団体情報", default: true },
    { name: "contact", title: "連絡先" },
    { name: "other", title: "その他" },
  ],
  preview: {
    select: { title: "org.name" },
    prepare: ({ title }: { title?: { _key: string; value: string }[] }) => ({
      title: title?.find((t) => t._key === "ja")?.value || "サイト設定",
    }),
  },
  fields: [
    defineField({
      name: "org",
      title: "団体情報",
      type: "object",
      group: "org",
      fields: [
        defineField({ name: "designation", title: "法人格", type: "string" }),
        defineField({ name: "name", title: "名称", type: "internationalizedArrayString", validation: (Rule) => Rule.required() }),
        defineField({ name: "abbreviation", title: "略称", type: "string" }),
        defineField({ name: "founded", title: "設立年", type: "string" }),
        defineField({ name: "npoEstablished", title: "NPO認証年", type: "string" }),
        defineField({ name: "lastUpdated", title: "最終更新日", type: "date" }),
        defineField({ name: "description", title: "説明", type: "internationalizedArrayString" }),
      ],
    }),
    defineField({
      name: "contact",
      title: "連絡先",
      type: "object",
      group: "contact",
      fields: [
        defineField({ name: "postalCode", title: "郵便番号", type: "string" }),
        defineField({ name: "address", title: "住所", type: "internationalizedArrayString" }),
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
      type: "internationalizedArrayString",
      group: "other",
    }),
    defineField({ name: "copyright", title: "著作権表示", type: "string", group: "other" }),
    defineField({ name: "googleMapsEmbedUrl", title: "Googleマップ埋め込みURL", type: "string", group: "other" }),
  ],
});
