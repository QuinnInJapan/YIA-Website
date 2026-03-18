import type { BoardMembersSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import BoardMembers from "@/components/BoardMembers";

export const boardMembers: SectionHandler<BoardMembersSection> = (s, ctx) => {
  if (!s.members) {
    ctx.flush();
    return;
  }
  ctx.addTocHeader(ja(s.title), en(s.title));
  ctx.push(<BoardMembers board={{ asOf: s.asOf, members: s.members }} />);
  ctx.flush();
};
