// Object types
import bilingualText from "./bilingualText";
import infoRow from "./infoRow";
import imageFile from "./imageFile";
import documentLink from "./documentLink";
import eventFlyer from "./eventFlyer";
import resourceLink from "./resourceLink";
import definition from "./definition";
import sisterCity from "./sisterCity";
import groupScheduleRow from "./groupScheduleRow";
import scheduleDateEntry from "./scheduleDateEntry";
import boardMember from "./boardMember";
import resourceBox from "./resourceBox";

// Section types
import warningsSection from "./warningsSection";
import contentSection from "./contentSection";
import infoTableSection from "./infoTableSection";
import otherNotesSection from "./otherNotesSection";
import scheduleSection from "./scheduleSection";
import gallerySection from "./gallerySection";
import sisterCitiesSection from "./sisterCitiesSection";
import definitionsSection from "./definitionsSection";
import resourcesSection from "./resourcesSection";
import historySection from "./historySection";
import fairTradeSection from "./fairTradeSection";
import flyersSection from "./flyersSection";
import documentsSection from "./documentsSection";
import boardMembersSection from "./boardMembersSection";
import feeTableSection from "./feeTableSection";
import directoryListSection from "./directoryListSection";

// Document types
import siteSettings from "./siteSettings";
import category from "./category";
import navigation from "./navigation";
import announcement from "./announcement";
import globalResources from "./globalResources";
import homepage from "./homepage";
import page from "./page";

export const schemaTypes = [
  // Object types (must be registered before document types that reference them)
  bilingualText,
  infoRow,
  imageFile,
  documentLink,
  eventFlyer,
  resourceLink,
  definition,
  sisterCity,
  groupScheduleRow,
  scheduleDateEntry,
  boardMember,
  resourceBox,
  // Section types
  warningsSection,
  contentSection,
  infoTableSection,
  otherNotesSection,
  scheduleSection,
  gallerySection,
  sisterCitiesSection,
  definitionsSection,
  resourcesSection,
  historySection,
  fairTradeSection,
  flyersSection,
  documentsSection,
  boardMembersSection,
  feeTableSection,
  directoryListSection,
  // Document types
  siteSettings,
  category,
  navigation,
  announcement,
  globalResources,
  homepage,
  page,
];
