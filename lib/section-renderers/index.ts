// lib/section-renderers/index.ts
import type { SectionHandler } from "./types";
import { table } from "./table";
import { labelTable } from "./label-table";
import { infoCards } from "./info-cards";
import { imageCards } from "./image-cards";
import { warnings } from "./warnings";
import { content } from "./content";
import { gallery } from "./gallery";
import { links } from "./links";

export const sectionHandlers: Record<string, SectionHandler> = {
  table,
  labelTable,
  infoCards,
  imageCards,
  warnings,
  content,
  gallery,
  links,
};
