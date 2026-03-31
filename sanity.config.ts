import { defineConfig, defineField } from "sanity";
import { jaJPLocale } from "@sanity/locale-ja-jp";
import { internationalizedArray } from "sanity-plugin-internationalized-array";
import { mediaPlugin } from "./sanity/components/mediaPlugin";
import { blogPostsPlugin } from "./sanity/components/blogPostsPlugin";
import { announcementsPlugin } from "./sanity/components/announcementsPlugin";
import { homepagePlugin } from "./sanity/components/homepagePlugin";
import { pagesPlugin } from "./sanity/components/pagesPlugin";
import { schemaTypes } from "./sanity/schemas";
import { cleanDeleteAction } from "./sanity/actions/cleanDeleteAction";

export default defineConfig({
  name: "yia-website",
  title: "横須賀国際交流協会",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  basePath: "/studio",
  plugins: [
    homepagePlugin(),
    announcementsPlugin(),
    pagesPlugin(),
    blogPostsPlugin(),
    mediaPlugin(),
    jaJPLocale(),
    internationalizedArray({
      languages: [
        { id: "ja", title: "日本語" },
        { id: "en", title: "English" },
      ],
      fieldTypes: [
        defineField({ name: "string", type: "string", title: " " }),
        defineField({ name: "text", type: "text", title: " " }),
        defineField({
          name: "blockContent",
          type: "array",
          title: " ",
          of: [
            {
              type: "block",
              styles: [
                { title: "Normal", value: "normal" },
                { title: "見出し2", value: "h2" },
                { title: "見出し3", value: "h3" },
                { title: "見出し4", value: "h4" },
              ],
              marks: {
                decorators: [
                  { title: "太字", value: "strong" },
                  { title: "斜体", value: "em" },
                ],
                annotations: [
                  {
                    name: "link",
                    type: "object",
                    title: "リンク",
                    fields: [{ name: "href", type: "url", title: "URL" }],
                  },
                ],
              },
              lists: [
                { title: "箇条書き", value: "bullet" },
                { title: "番号付き", value: "number" },
              ],
            },
            {
              type: "image",
              options: { hotspot: true, accept: "image/*" },
              fields: [
                defineField({
                  name: "alt",
                  type: "string",
                  title: "代替テキスト",
                  description: "画像の説明（アクセシビリティ用）",
                }),
              ],
            },
            {
              type: "object",
              name: "callout",
              title: "コールアウト",
              fields: [
                defineField({
                  name: "tone",
                  type: "string",
                  title: "種類",
                  options: {
                    list: [
                      { title: "情報", value: "info" },
                      { title: "注意", value: "warning" },
                      { title: "ヒント", value: "tip" },
                    ],
                  },
                  initialValue: "info",
                }),
                defineField({ name: "body", type: "text", title: "内容" }),
              ],
              preview: {
                select: { tone: "tone", body: "body" },
                prepare: ({ tone, body }: { tone?: string; body?: string }) => ({
                  title: `${tone ?? "info"}: ${body?.slice(0, 50) ?? ""}`,
                }),
              },
            },
            {
              type: "object",
              name: "youtube",
              title: "YouTube動画",
              fields: [
                defineField({ name: "url", type: "url", title: "YouTube URL" }),
                defineField({ name: "caption", type: "string", title: "キャプション" }),
              ],
              preview: {
                select: { url: "url", caption: "caption" },
                prepare: ({ url, caption }: { url?: string; caption?: string }) => ({
                  title: caption || url || "YouTube動画",
                }),
              },
            },
            {
              type: "object",
              name: "inlineGallery",
              title: "ギャラリー",
              fields: [
                defineField({
                  name: "images",
                  type: "array",
                  title: "画像",
                  of: [{ type: "imageFile" }],
                  validation: (Rule) => Rule.min(1).error("画像を1枚以上追加してください"),
                }),
              ],
              preview: {
                select: { images: "images" },
                prepare: ({ images }: { images?: unknown[] }) => ({
                  title: `ギャラリー（${images?.length ?? 0}枚）`,
                }),
              },
            },
          ],
        }),
      ],
    }),
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    newDocumentOptions: (prev) =>
      prev.filter(
        (item) =>
          ![
            "siteSettings",
            "homepage",
            "navigation",
            "homepageFeatured",
            "sidebar",
            "category",
          ].includes(item.templateId),
      ),
    actions: (prev, context) => {
      if (context.schemaType === "blogPost") {
        return prev.map((action) => (action.action === "delete" ? cleanDeleteAction : action));
      }
      return prev;
    },
  },
});
