import path from "node:path";
import { fail, i18n } from "./sanity-tools.mjs";

export const DEFAULT_ATTACHMENTS_DIR = "/Users/quinnngo/Downloads/attachments";
export const DISPATCH_GALLERY_KEY = "4f2abb05-d3f";
export const SISTER_CITY_PAGE_IDS = ["page-sistercity", "drafts.page-sistercity"];

export const EXCHANGE_STUDENT_PHOTOS = [
  {
    filename: "第2回研修　写真の撮り方.jpg",
    captionJa: "第2回研修：写真の撮り方",
    captionEn: "Training Session 2: Photography",
  },
  {
    filename: "photo_20260610-033636.jpg",
    captionJa: "2026年度派遣学生研修",
    captionEn: "2026 exchange student training",
  },
  {
    filename: "photo_20260610-033721.jpg",
    captionJa: "2026年度派遣学生研修",
    captionEn: "2026 exchange student training",
  },
  {
    filename: "photo_20260610-033804.jpg",
    captionJa: "2026年度派遣学生研修",
    captionEn: "2026 exchange student training",
  },
  {
    filename: "photo_20260610-033805_3.jpg",
    captionJa: "2026年度派遣学生研修",
    captionEn: "2026 exchange student training",
  },
  {
    filename: "第4回研修　英会話.jpg",
    captionJa: "第4回研修：英会話",
    captionEn: "Training Session 4: English Conversation",
  },
];

export function attachmentPlan(attachmentsDir = DEFAULT_ATTACHMENTS_DIR) {
  return EXCHANGE_STUDENT_PHOTOS.map((photo) => ({
    ...photo,
    path: path.join(attachmentsDir, photo.filename),
  }));
}

export function replaceExchangeStudentGallery(sections, assetsByFilename) {
  if (!Array.isArray(sections)) {
    throw fail("Sister City page sections are missing or invalid.", {
      fix: "Fetch the page with its sections array before applying the gallery replacement.",
      context: { sectionsType: typeof sections },
    });
  }

  let images = null;
  let found = false;
  const nextSections = sections.map((section) => {
    if (section?._key !== DISPATCH_GALLERY_KEY) return section;
    if (section._type !== "gallery") {
      throw fail("Exchange-student gallery section has the wrong type.", {
        fix: "Check the current page-sistercity Sanity document before patching.",
        context: {
          sectionKey: DISPATCH_GALLERY_KEY,
          expectedType: "gallery",
          actualType: section._type,
        },
      });
    }

    found = true;
    images = buildGalleryImages(assetsByFilename);
    return { ...section, images };
  });

  if (!found) {
    throw fail("Exchange-student gallery section was not found.", {
      fix: "Confirm the current dispatch gallery key on page-sistercity.",
      context: { sectionKey: DISPATCH_GALLERY_KEY },
    });
  }

  return { sections: nextSections, images };
}

export function stableStringify(value) {
  return JSON.stringify(sortKeys(value));
}

function buildGalleryImages(assetsByFilename) {
  return EXCHANGE_STUDENT_PHOTOS.map((photo, index) => {
    const asset = assetForFilename(assetsByFilename, photo.filename);
    return {
      _key: `p007-exchange-photo-${index + 1}`,
      _type: "imageFile",
      file: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      },
      caption: i18n(photo.captionJa, photo.captionEn),
    };
  });
}

function assetForFilename(assetsByFilename, filename) {
  const asset =
    assetsByFilename instanceof Map ? assetsByFilename.get(filename) : assetsByFilename?.[filename];

  if (!asset?._id) {
    throw fail("Missing uploaded image asset for exchange-student photo.", {
      fix: "Upload every planned attachment image before building the gallery patch.",
      context: { filename, knownFilenames: knownFilenames(assetsByFilename) },
    });
  }

  return asset;
}

function knownFilenames(assetsByFilename) {
  if (assetsByFilename instanceof Map) return Array.from(assetsByFilename.keys());
  if (assetsByFilename && typeof assetsByFilename === "object") return Object.keys(assetsByFilename);
  return [];
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortKeys(value[key])]),
  );
}
