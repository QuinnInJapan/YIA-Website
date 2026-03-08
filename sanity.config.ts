import { defineConfig, defineField, buildLegacyTheme } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { jaJPLocale } from "@sanity/locale-ja-jp";
import { internationalizedArray } from "sanity-plugin-internationalized-array";
import { schemaTypes } from "./sanity/schemas";
import { structure } from "./sanity/structure";
import { dashboardPlugin } from "./sanity/components/DashboardTool";

const theme = buildLegacyTheme({
  // Base palette — needed for derived colors to propagate
  "--black": "#1a2030",
  "--white": "#f7f9fb",
  "--gray": "#6b7a8d",
  "--gray-base": "#8a95a5",

  // Brand — light enough that derived hover/active backgrounds stay readable
  "--brand-primary": "#4a90d9",
  "--focus-color": "#4a90d9",

  // Navigation sidebar
  "--main-navigation-color": "#132845",
  "--main-navigation-color--inverted": "#f7f9fb",

  // Content area
  "--component-bg": "#f7f9fb",
  "--component-text-color": "#1a2030",

  // Buttons
  "--default-button-color": "#6b7a8d",
  "--default-button-primary-color": "#4a90d9",
  "--default-button-success-color": "#2e7d32",
  "--default-button-warning-color": "#855f07",
  "--default-button-danger-color": "#cc5533",

  // State indicators
  "--state-info-color": "#4a90d9",
  "--state-danger-color": "#cc5533",
  "--state-warning-color": "#855f07",
  "--state-success-color": "#2e7d32",
});

export default defineConfig({
  name: "yia-website",
  title: "横須賀国際交流協会",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  basePath: "/studio",
  theme,
  plugins: [
    dashboardPlugin(),
    structureTool({ structure, title: "コンテンツ管理" }),
    presentationTool({
      title: "プレビュー",
      previewUrl: {
        previewMode: {
          enable: "/api/draft-mode/enable",
        },
      },
    }),
    jaJPLocale(),
    internationalizedArray({
      languages: [
        { id: "ja", title: "日本語" },
        { id: "en", title: "English" },
        { id: "easy", title: "やさしい日本語" },
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
          !["siteSettings", "homepage", "navigation", "sidebar", "category"].includes(
            item.templateId,
          ),
      ),
  },
});
