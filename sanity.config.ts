import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { jaJPLocale } from "@sanity/locale-ja-jp";
import { schemaTypes } from "./sanity/schemas";
import { structure } from "./sanity/structure";

export default defineConfig({
  name: "yia-website",
  title: "YIA Website",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  basePath: "/studio",
  plugins: [structureTool({ structure }), jaJPLocale()],
  schema: {
    types: schemaTypes,
  },
});
