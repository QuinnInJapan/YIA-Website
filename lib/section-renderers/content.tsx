import type { ContentSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import BilingualPortableText from "@/components/BilingualPortableText";

export const content: SectionHandler<ContentSection> = (s, ctx) => {
  if (ja(s.title)) {
    ctx.addTocHeader(ja(s.title), en(s.title));
  }
  if (s.body) {
    ctx.push(<BilingualPortableText field={s.body} />);
  }
  ctx.flush();
};
