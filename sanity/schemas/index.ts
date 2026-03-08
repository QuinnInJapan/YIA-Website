// Object types
import infoRow from "./infoRow";
import imageFile from "./imageFile";
import documentLink from "./documentLink";
import eventFlyer from "./eventFlyer";
import definition from "./definition";
import sisterCity from "./sisterCity";
import groupScheduleRow from "./groupScheduleRow";
import scheduleDateEntry from "./scheduleDateEntry";
import boardMember from "./boardMember";

// Section types
import warningsSection from "./warningsSection";
import contentSection from "./contentSection";
import infoTableSection from "./infoTableSection";
import tableScheduleSection from "./tableScheduleSection";
import groupScheduleSection from "./groupScheduleSection";
import eventScheduleSection from "./eventScheduleSection";
import gallerySection from "./gallerySection";
import sisterCitiesSection from "./sisterCitiesSection";
import definitionsSection from "./definitionsSection";
import linksSection from "./linksSection";
import historySection from "./historySection";
import fairTradeSection from "./fairTradeSection";
import flyersSection from "./flyersSection";
import boardMembersSection from "./boardMembersSection";
import feeTableSection from "./feeTableSection";
import directoryListSection from "./directoryListSection";

// Document types
import siteSettings from "./siteSettings";
import category from "./category";
import navigation from "./navigation";
import announcement from "./announcement";
import blogPost from "./blogPost";
import sidebar from "./sidebar";
import homepage from "./homepage";
import page from "./page";

export const schemaTypes = [
  // Object types (must be registered before document types that reference them)
  infoRow,
  imageFile,
  documentLink,
  eventFlyer,
  definition,
  sisterCity,
  groupScheduleRow,
  scheduleDateEntry,
  boardMember,
  // Section types
  warningsSection,
  contentSection,
  infoTableSection,
  tableScheduleSection,
  groupScheduleSection,
  eventScheduleSection,
  gallerySection,
  sisterCitiesSection,
  definitionsSection,
  linksSection,
  historySection,
  fairTradeSection,
  flyersSection,
  boardMembersSection,
  feeTableSection,
  directoryListSection,
  // Document types
  siteSettings,
  category,
  navigation,
  announcement,
  blogPost,
  sidebar,
  homepage,
  page,
];
