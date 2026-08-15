import { studioTheme } from "@sanity/ui";

const studioSans =
  '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic UI", "Yu Gothic", Meiryo, "Segoe UI", sans-serif';
const studioThemeV2 = studioTheme.v2!;

const textFontSizes = [13, 15, 17, 19, 22] as const;
const textLineHeights = [19, 23, 25, 27, 31] as const;
const labelFontSizes = [12, 13, 14, 15, 16, 17] as const;
const labelLineHeights = [16, 18, 20, 21, 23, 25] as const;

type StudioFontSize = (typeof studioThemeV2.font.text.sizes)[number];

function readableFontSizes(
  sizes: StudioFontSize[],
  fontSizes: readonly number[],
  lineHeights: readonly number[],
): StudioFontSize[] {
  return sizes.map((size, index) => {
    const fontSize = fontSizes[index] ?? size.fontSize;
    const lineHeight = lineHeights[index] ?? size.lineHeight;
    return {
      ...size,
      fontSize,
      lineHeight,
      iconSize: lineHeight + 2,
      ascenderHeight: Math.round(fontSize * 0.38),
      descenderHeight: Math.round(fontSize * 0.38),
    };
  });
}

const readableTextSizes = readableFontSizes(
  studioThemeV2.font.text.sizes,
  textFontSizes,
  textLineHeights,
);
const readableLabelSizes = readableFontSizes(
  studioThemeV2.font.label.sizes,
  labelFontSizes,
  labelLineHeights,
);

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
        sizes: readableTextSizes,
      },
      heading: {
        ...studioThemeV2.font.heading,
        family: studioSans,
      },
      label: {
        ...studioThemeV2.font.label,
        family: studioSans,
        sizes: readableLabelSizes,
      },
    },
  },
  fonts: {
    ...studioTheme.fonts,
    text: {
      ...studioTheme.fonts.text,
      family: studioSans,
      weights: { ...studioTheme.fonts.text.weights, regular: 500 },
      sizes: readableTextSizes,
    },
    heading: {
      ...studioTheme.fonts.heading,
      family: studioSans,
    },
    label: {
      ...studioTheme.fonts.label,
      family: studioSans,
      sizes: readableLabelSizes,
    },
  },
};
