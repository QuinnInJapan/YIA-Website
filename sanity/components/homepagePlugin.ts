import { definePlugin, type Tool } from "sanity";
import { HomepageTool } from "./HomepageTool";
import { SiteSettingsTool } from "./SiteSettingsTool";

const homepageTool: Tool = {
  name: "homepage",
  title: "ホームページ",
  component: HomepageTool,
};

const siteSettingsTool: Tool = {
  name: "site-settings",
  title: "サイト設定",
  component: SiteSettingsTool,
};

export const homepagePlugin = definePlugin({
  name: "yia-homepage",
  tools: [homepageTool, siteSettingsTool],
});
