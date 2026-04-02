import type { SectionHandler } from "./types";
// New handlers
import { table } from "./table";
import { labelTable } from "./label-table";
import { infoCards } from "./info-cards";
import { imageCards } from "./image-cards";
// Legacy handlers (removed in Task 18 after migrations)
import { warnings } from "./warnings";
import { content } from "./content";
import { infoTable } from "./info-table";
import { tableSchedule, groupSchedule, eventSchedule } from "./schedules";
import { gallery } from "./gallery";
import { sisterCities } from "./sister-cities";
import { definitions } from "./definitions";
import { links } from "./links";
import { history } from "./history";
import { fairTrade } from "./fair-trade";
import { flyers } from "./flyers";
import { boardMembers } from "./board-members";
import { feeTable } from "./fee-table";
import { directoryList } from "./directory-list";

export const sectionHandlers: Record<string, SectionHandler> = {
  // New
  table,
  labelTable,
  infoCards,
  imageCards,
  // Legacy
  warnings,
  content,
  infoTable,
  tableSchedule,
  groupSchedule,
  eventSchedule,
  gallery,
  sisterCities,
  definitions,
  links,
  history,
  fairTrade,
  flyers,
  boardMembers,
  feeTable,
  directoryList,
};
