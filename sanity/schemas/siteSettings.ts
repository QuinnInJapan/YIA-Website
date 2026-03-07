import { defineType, defineField } from "sanity";
import { CogIcon } from "@sanity/icons";

export default defineType({
  name: "siteSettings",
  title: "サイト設定",
  type: "document",
  icon: CogIcon,
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
      description: "協会の基本情報。サイト全体のヘッダー・フッターに表示されます。",
      fields: [
        defineField({ name: "designation", title: "法人格", type: "string", description: "法人格の種別（例：公益財団法人）。" }),
        defineField({ name: "name", title: "名称", type: "internationalizedArrayString", description: "協会の正式名称。サイトのタイトルに使用されます。", validation: (Rule) => Rule.required() }),
        defineField({ name: "abbreviation", title: "略称", type: "string", description: "略称（例：YIA）。" }),
        defineField({ name: "founded", title: "設立年", type: "string", description: "設立年（例：1992年）。" }),
        defineField({ name: "npoEstablished", title: "NPO認証年", type: "string", description: "NPO法人認証年。" }),
        defineField({ name: "lastUpdated", title: "最終更新日", type: "date", description: "サイト情報の最終更新日。フッターに表示されます。" }),
        defineField({ name: "description", title: "説明", type: "internationalizedArrayString", description: "協会の簡単な説明。メタデータ等に使用されます。" }),
      ],
    }),
    defineField({
      name: "contact",
      title: "連絡先",
      type: "object",
      group: "contact",
      description: "協会の連絡先情報。お問い合わせページやフッターに表示されます。",
      fields: [
        defineField({ name: "postalCode", title: "郵便番号", type: "string", description: "郵便番号（例：013-0036）。" }),
        defineField({ name: "address", title: "住所", type: "internationalizedArrayString", description: "協会の住所。" }),
        defineField({ name: "tel", title: "電話番号", type: "string", description: "電話番号。" }),
        defineField({ name: "fax", title: "FAX", type: "string", description: "FAX番号。" }),
        defineField({ name: "email", title: "メール", type: "email", description: "メールアドレス。" }),
        defineField({ name: "website", title: "ウェブサイト", type: "url", description: "公式サイトのURL。" }),
        defineField({ name: "youtube", title: "YouTube", type: "url", description: "YouTubeチャンネルのURL。" }),
      ],
    }),
    defineField({
      name: "businessHours",
      title: "業務時間",
      type: "internationalizedArrayString",
      group: "other",
      description: "業務時間の表示テキスト。フッターに表示されます。",
    }),
    defineField({
      name: "copyright",
      title: "著作権表示",
      type: "string",
      group: "other",
      description: "フッター最下部の著作権表示テキスト。",
    }),
    defineField({
      name: "googleMapsEmbedUrl",
      title: "Googleマップ埋め込みURL",
      type: "url",
      group: "other",
      description: "お問い合わせページに埋め込むGoogleマップのURL。",
    }),
  ],
});
