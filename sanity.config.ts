import { defineConfig } from "sanity";
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
      fieldTypes: ["string", "text"],
    }),
  ],
  schema: {
    types: schemaTypes,
  },
});
