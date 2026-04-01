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
  infoTable: {
    rows: [],
  },
  links: {
    items: [],
  },
  gallery: {
    images: [],
  },
  flyers: {
    items: [],
  },
  eventSchedule: {
    entries: [],
  },
  groupSchedule: {
    groups: [],
  },
  tableSchedule: {
    columns: ["時間", "月", "火", "水", "木", "金"],
    columnsEn: ["Time", "Mon", "Tue", "Wed", "Thu", "Fri"],
    rows: [],
  },
  definitions: {
    items: [],
  },
  feeTable: {
    rows: [],
  },
  directoryList: {
    entries: [],
  },
  boardMembers: {
    members: [],
    asOf: new Date().toISOString().slice(0, 10),
  },
  fairTrade: {
    priceList: [],
  },
  sisterCities: {
    cities: [],
  },
  history: {
    years: [],
  },
};
