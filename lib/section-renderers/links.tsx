import type { LinksSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import { fileUrl } from "@/lib/sanity/image";
import DocList from "@/components/DocList";
import ResourceLink from "@/components/ResourceLink";

export const links: SectionHandler<LinksSection> = (s, ctx) => {
  if (!s.items) {
    ctx.flush();
    return;
  }
  ctx.addTocHeader(ja(s.title), en(s.title));
  const docItems = s.items.filter((it) => it.type !== "youtube");
  const ytItems = s.items.filter((it) => it.type === "youtube");
  if (docItems.length) {
    ctx.push(
      <DocList
        docs={docItems.map((it) => ({
          label: it.label,
          url: fileUrl(it.file) || it.url,
          type: it.fileType,
        }))}
      />,
    );
  }
  for (const res of ytItems) {
    ctx.push(
      <ResourceLink
        type="youtube"
        url={res.url || ""}
        titleJa={ja(res.label)}
        titleEn={en(res.label)}
      />,
    );
  }
  ctx.flush();
};
