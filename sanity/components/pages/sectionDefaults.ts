import type { SectionTypeName } from "./types";

/**
 * Per-type default fields merged into every newly created section.
 * Keep these minimal — just enough for the live preview to render without
 * errors and for the editor to show the right empty-state UI.
 *
 * title is always injected by addSection itself, so it is omitted here.
 */
export const sectionDefaults: Partial<Record<SectionTypeName, Record<string, unknown>>> = {
  warnings: {
    items: [],
  },
  content: {},
  links: {
    items: [],
  },
  gallery: {
    images: [],
  },
  table: {
    columns: [],
    rows: [],
  },
  labelTable: {
    rows: [],
  },
  infoCards: {
    items: [],
  },
  imageCards: {
    items: [],
  },
};
