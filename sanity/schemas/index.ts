// sanity/schemas/index.ts
// Object types
import infoRow from "./infoRow";
import imageFile from "./imageFile";
import documentLink from "./documentLink";
import definition from "./definition"; // still used by infoCardsSection
import sisterCity from "./sisterCity"; // still used by imageCardsSection

// Section types
import tableSection from "./tableSection";
import labelTableSection from "./labelTableSection";
import infoCardsSection from "./infoCardsSection";
import imageCardsSection from "./imageCardsSection";
import warningsSection from "./warningsSection";
import contentSection from "./contentSection";
import gallerySection from "./gallerySection";
import linksSection from "./linksSection";

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
  definition,
  sisterCity,
  // Section types
  tableSection,
  labelTableSection,
  infoCardsSection,
  imageCardsSection,
  warningsSection,
  contentSection,
  gallerySection,
  linksSection,
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
