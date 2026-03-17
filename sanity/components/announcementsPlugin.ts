import { definePlugin, type Tool } from "sanity";
import { AnnouncementsTool } from "./AnnouncementsTool";

const announcementsTool: Tool = {
  name: "announcements",
  title: "お知らせ",
  component: AnnouncementsTool,
};

export const announcementsPlugin = definePlugin({
  name: "yia-announcements",
  tools: [announcementsTool],
});
