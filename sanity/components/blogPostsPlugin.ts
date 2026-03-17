import { definePlugin, type Tool } from "sanity";
import { BlogPostsTool } from "./BlogPostsTool";

const blogPostsTool: Tool = {
  name: "blog",
  title: "ブログ",
  component: BlogPostsTool,
};

export const blogPostsPlugin = definePlugin({
  name: "yia-blog",
  tools: [blogPostsTool],
});
