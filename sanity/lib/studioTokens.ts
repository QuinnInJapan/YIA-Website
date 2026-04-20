// sanity/lib/studioTokens.ts

/**
 * Semantic font-size constants for custom Studio components.
 *
 * These are for inline `style={{ fontSize: fs.body }}` usage in custom
 * React components. Do NOT use for Sanity UI component `fontSize={N}` props
 * — those use Sanity's own scale and should be left as-is.
 */
export const fs = {
  meta: 13, // hints, timestamps, system badges, count labels
  label: 14, // field labels, nav group headers, section titles in forms
  body: 15, // nav items, list items, descriptions, button text
  title: 17, // panel titles, major section headings
} as const;
