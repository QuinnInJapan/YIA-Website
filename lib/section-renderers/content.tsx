import type { ContentSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import { resolveDocs } from "@/lib/sanity/image";
import BilingualPortableText from "@/components/BilingualPortableText";
import InfoTable from "@/components/InfoTable";
import Checklist from "@/components/Checklist";
import DocList from "@/components/DocList";
import Callout from "@/components/Callout";
import PhotoGalleryWrapper from "@/components/PhotoGalleryWrapper";
import { buildGalleryImages } from "./gallery";

export const content: SectionHandler<ContentSection> = (s, ctx) => {
  if (ja(s.title)) {
    ctx.addTocHeader(ja(s.title), en(s.title));
  }
  if (s.description) {
    ctx.push(<BilingualPortableText field={s.description} />);
  }
  if (s.infoTable) {
    ctx.push(<InfoTable rows={s.infoTable} />);
  }
  if (s.checklist) {
    ctx.push(<Checklist items={s.checklist} />);
  }
  if (s.documents?.length) {
    ctx.push(<DocList docs={resolveDocs(s.documents)} />);
  }
  if (s.note) {
    ctx.push(<Callout field={s.note} notePrefix="※ " />);
  }
  if (s.images?.length) {
    const galleryImages = buildGalleryImages(s.images);
    if (galleryImages.length) {
      ctx.push(<PhotoGalleryWrapper images={galleryImages} />);
    }
  }
  ctx.flush();
};
