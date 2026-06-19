# Schedule Directory Display Mode Design

## Goal

Create a reusable table display mode for schedule-like information that is easier to scan than a wide comparison table while preserving proper alignment across rows.

The first target is the Japanese conversation salon page, especially the adult and student class schedules. The format must remain non-bespoke: it should work for future schedules that share the same broad shape of name, day, time, location/floor, fee, optional audience/remarks, and file links.

## Problem With Current Format

The current comparison table preserves columns, but the content is not naturally comparative. Visitors are trying to find a class that fits their schedule. The table makes every field equally loud, repeats bilingual text in every cell, gives PDF links too much visual weight, and creates awkward wrapping such as `Mo / n`.

The existing schedule list solves some wrapping problems, but its detail fields do not create a strong enough aligned scanning path on desktop. The new format should combine the discipline of table alignment with the readability of a directory listing.

## Recommended Pattern: Schedule Directory

Add a new table display mode named `scheduleDirectory`.

The desktop layout uses aligned tracks:

```text
DAY    TIME          CLASS                         DETAILS                  ACTIONS
Mon    10:15-11:45   いろは会 / Iroha-kai          4F · 1学期 1,000円       PDF
Mon    18:00-19:30   にほんごくらぶ / Nihongo Club  6F · 年度1回 1,000円     PDF
Tue    18:00-19:30   たのしいにほんご / ENJOY...    4F · 1学期 1,000円       PDF Photos
```

It should look like a calm timetable, not a card grid. Rows align by day, time, class, details, and actions. Bilingual text stays paired within each track, but the row's primary scanning values stay vertically aligned.

## Desktop Alignment Rules

Use CSS grid with named tracks, not an HTML table:

```css
grid-template-columns:
  minmax(3.5rem, 4.5rem)    /* day */
  minmax(7.5rem, 9rem)      /* time */
  minmax(13rem, 1.2fr)      /* class name */
  minmax(12rem, 1fr)        /* details */
  minmax(7rem, auto);       /* file actions */
```

The exact values can be tuned during implementation, but the concept is fixed:

- Day has a narrow fixed-feeling track.
- Time has enough width to prevent normal time ranges from wrapping.
- Class name gets the largest flexible area.
- Details get a flexible area for floor, location, fee, learner, or remarks.
- File actions align to the right and never drive the row's main rhythm.

Rows should share one grid context so columns align across all entries in the section. Do not render each entry as an independent card grid on desktop.

When a section has group rows, render them as full-width group separators spanning all tracks.

## Mobile Alignment Rules

Mobile should not imitate the desktop table. It should keep a consistent internal order:

```text
Mon
10:15-11:45
いろは会
Iroha-kai
4F · 1学期 1,000円
1,000 yen/term
PDF
```

On mobile:

- Group by day when day values exist.
- Put day and time at the top of each entry.
- Keep class name prominent.
- Render details below in a consistent order.
- Keep file actions as compact buttons at the bottom.
- Avoid nested cards and heavy boxes; use separators and spacing.

This gives mobile users readable entries while preserving predictable alignment within each entry.

## Field Mapping

The renderer should infer common fields from column keys first, then labels as a fallback.

Recognized fields:

- `group`, `name`, or first text column: class name
- `day`: day
- `time`: time
- `floor`: floor
- `location`: location
- `fee`: fee
- `learner`: learner/audience
- `remarks`: remarks
- file columns: actions

Unknown text columns should still render as labeled details so the format remains reusable.

## Detail Composition

For compact schedule rows, details should be composed in this order:

1. Floor
2. Location
3. Fee
4. Learner
5. Remarks
6. Unknown fields

For sections whose heading already names the location, floor and fee are usually enough in the detail track. For mixed-location sections, location should be visible as a full detail line.

The renderer should not delete data. It may visually de-emphasize repeated context, but every source field must remain available in the markup.

## File Actions

File links should be actions, not data columns. Render each file link as a small button-like text link using the column label when the filename is too long or not helpful.

Examples:

- `PDF`
- `Photos`
- `Application`

The full filename can remain in the title attribute or accessible label if useful.

## CMS Behavior

Add `scheduleDirectory` as another table display option alongside `table`, `comparisonTable`, and `scheduleList`.

Editors continue entering rows and columns the same way. This display mode only changes the public rendering and Studio preview.

## Accessibility

Because this is not an HTML table, each entry should preserve relationships through semantic structure:

- Use a list container for the schedule.
- Each schedule entry is an article or list item.
- Use visible labels for details on mobile and screen-reader-friendly labels on desktop.
- File actions must have clear link text and open documents safely with `target="_blank"` and `rel="noopener noreferrer"`.

## Testing

Add focused tests for the Japanese conversation salon page:

- Page renders `scheduleDirectory` sections with visible content.
- Adult Sogo section shows aligned class entries and file actions.
- Time values do not split into individual letters.
- Known text remains present: `Iroha-kai`, `Potluck International`, `TERAKOYA-SAN`, `総合福祉会館`, `2026irohakai.pdf`.
- Mobile viewport shows stacked entries with day/time/name/details/actions in order.

## Non-Goals

- Do not create a bespoke Japanese conversation component.
- Do not replace all tables on the site.
- Do not add filtering, search, accordions, or interactive sorting in this pass.
- Do not require editors to restructure the underlying content model.
