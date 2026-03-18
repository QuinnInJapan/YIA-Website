import { definePlugin, type Tool } from "sanity";
import { PagesTool } from "./PagesTool";

const pagesTool: Tool = {
  name: "pages",
  title: "ページ管理",
  component: PagesTool,
};

export const pagesPlugin = definePlugin({
  name: "yia-pages",
  tools: [pagesTool],
});
