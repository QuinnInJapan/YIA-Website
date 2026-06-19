import { defineField } from "sanity";

export const tocLevelField = defineField({
  name: "tocLevel",
  title: "目次での扱い",
  type: "string",
  options: {
    layout: "radio",
    list: [
      { title: "大見出し（目次に表示）", value: "section" },
      { title: "小見出し（目次に入れ子で表示）", value: "subsection" },
      { title: "本文のみ（目次に表示しない）", value: "hidden" },
    ],
  },
  initialValue: "section",
  description: "ページ内の目次と見出し階層を指定します。",
});
