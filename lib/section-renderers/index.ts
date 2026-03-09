import type { SectionHandler } from "./types";
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
