import { defineConfig, defineField } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { jaJPLocale } from "@sanity/locale-ja-jp";
import { internationalizedArray } from "sanity-plugin-internationalized-array";
import { schemaTypes } from "./sanity/schemas";
import { structure } from "./sanity/structure";

export default defineConfig({
  name: "yia-website",
  title: "YIA Website",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  basePath: "/studio",
  plugins: [
    structureTool({ structure }),
    presentationTool({
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
              styles: [{ title: "Normal", value: "normal" }],
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
