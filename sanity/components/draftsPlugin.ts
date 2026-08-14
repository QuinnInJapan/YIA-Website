import { definePlugin, type Tool } from "sanity";
import { DraftsTool } from "./DraftsTool";

const draftsTool: Tool = {
  name: "drafts",
  title: "未公開の変更",
  component: DraftsTool,
};

export const draftsPlugin = definePlugin({
  name: "yia-drafts",
  tools: [draftsTool],
});
