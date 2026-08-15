import { studioTheme } from "@sanity/ui";

const studioSans =
  '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic UI", "Yu Gothic", Meiryo, "Segoe UI", sans-serif';
const studioThemeV2 = studioTheme.v2!;

/**
 * Keep Sanity's spacing and hierarchy while making Japanese interface text
 * easier to scan. A medium regular weight avoids the thin appearance of the
 * default Latin-first stack without making labels compete with headings.
 */
export const yiaStudioTheme = {
  ...studioTheme,
  v2: {
    ...studioThemeV2,
    _version: 2 as const,
    font: {
      ...studioThemeV2.font,
      text: {
        ...studioThemeV2.font.text,
        family: studioSans,
        weights: { ...studioThemeV2.font.text.weights, regular: 500 },
      },
      heading: {
        ...studioThemeV2.font.heading,
        family: studioSans,
      },
      label: {
        ...studioThemeV2.font.label,
        family: studioSans,
      },
    },
  },
  fonts: {
    ...studioTheme.fonts,
    text: {
      ...studioTheme.fonts.text,
      family: studioSans,
      weights: { ...studioTheme.fonts.text.weights, regular: 500 },
    },
    heading: {
      ...studioTheme.fonts.heading,
      family: studioSans,
    },
    label: {
      ...studioTheme.fonts.label,
      family: studioSans,
    },
  },
};
