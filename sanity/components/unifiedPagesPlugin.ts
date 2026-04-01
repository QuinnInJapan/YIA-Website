// sanity/components/unifiedPagesPlugin.ts
import { definePlugin, type Tool } from "sanity";
import { UnifiedPagesTool } from "./UnifiedPagesTool";

const unifiedPagesTool: Tool = {
  name: "pages",
  title: "ページ管理",
  component: UnifiedPagesTool,
};

export const unifiedPagesPlugin = definePlugin({
  name: "yia-unified-pages",
  tools: [unifiedPagesTool],
});
