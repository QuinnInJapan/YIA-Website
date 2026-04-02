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

// Section types — NEW
import tableSection from "./tableSection";
import labelTableSection from "./labelTableSection";
import infoCardsSection from "./infoCardsSection";
import imageCardsSection from "./imageCardsSection";

// Section types — LEGACY (kept until migrations complete, removed in Task 18)
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
import homepageAbout from "./homepageAbout";
import homepageFeatured from "./homepageFeatured";
import page from "./page";

export const schemaTypes = [
  // Object types
  infoRow,
  imageFile,
  documentLink,
  eventFlyer,
  definition,
  sisterCity,
  groupScheduleRow,
  scheduleDateEntry,
  boardMember,
  // Section types — NEW
  tableSection,
  labelTableSection,
  infoCardsSection,
  imageCardsSection,
  // Section types — LEGACY
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
  homepageAbout,
  homepageFeatured,
  page,
];
