import { definePlugin, type Tool } from "sanity";
import { MediaBrowser } from "./MediaBrowser";

const mediaTool: Tool = {
  name: "media",
  title: "メディア",
  component: MediaBrowser,
};

export const mediaPlugin = definePlugin({
  name: "yia-media",
  tools: [mediaTool],
});
