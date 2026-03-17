import { definePlugin, type Tool } from "sanity";
import { HomepageTool } from "./HomepageTool";

const homepageTool: Tool = {
  name: "homepage",
  title: "ホームページ",
  component: HomepageTool,
};

export const homepagePlugin = definePlugin({
  name: "yia-homepage",
  tools: [homepageTool],
});
