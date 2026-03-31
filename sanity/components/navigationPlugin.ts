import { definePlugin, type Tool } from "sanity";
import { NavigationTool } from "./NavigationTool";

const navigationTool: Tool = {
  name: "navigation",
  title: "ナビゲーション",
  component: NavigationTool,
};

export const navigationPlugin = definePlugin({
  name: "yia-navigation",
  tools: [navigationTool],
});
