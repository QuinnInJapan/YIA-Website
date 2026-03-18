import type { DirectoryListSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import DirectoryList from "@/components/DirectoryList";

export const directoryList: SectionHandler<DirectoryListSection> = (s, ctx) => {
  if (!s.entries) {
    ctx.flush();
    return;
  }
  ctx.addTocHeader(ja(s.title), en(s.title));
  ctx.push(<DirectoryList entries={s.entries} />);
  ctx.flush();
};
