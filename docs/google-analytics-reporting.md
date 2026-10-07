# Google Analytics reporting for YIA

This setup uses standard Google Analytics 4 (GA4), measurement ID
`G-5XYKT7ST20`, for the public production website. The ID is public. Standard GA4
is free; no paid plan, billing account, trial, credit card, paid connector or
server-side analytics service is part of this setup.

## Free-only constraints and Vercel usage

The browser loads Google's tag after hydration and sends events directly to
Google. The integration adds no API route, Vercel function invocation, Sanity
request, timed cache refresh, cookie read on the server or analytics proxy.
Ordinary public pages remain prerendered. Local, preview, Studio and standalone
PDF-viewer pages do not load this tag.

There is a small browser script and hosting asset-size overhead. Normal website
traffic still uses the existing Vercel plan's requests and bandwidth. Existing
Vercel Web Analytics and Speed Insights are separate products with their own plan
limits; adding GA4 does not make hosting or those products universally free. The
new custom events use only `gtag`, so they do not add Vercel custom analytics
events. Do not upgrade a Vercel plan or enable paid analytics add-ons for this work.

Use GA4's built-in reports, explorations and manual exports. Stay within the
standard property's limits. If a feature requires payment or an upgrade, omit it.
Do not enable Analytics 360, Looker Studio Pro, BigQuery export, server-side Tag
Manager, a Cloud billing account or a paid third-party connector. A free Looker
Studio dashboard with Google's native connector can be considered later if
clients need presentation beyond GA4; it is not required to collect or report data.

## What clients can measure

| Question                                         | Measurement                                                                        | Interpretation                                                                                                    |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| How many people visit?                           | Active/new/returning users, sessions, views                                        | Browser-based estimates; cookies, consent and blockers affect counts.                                             |
| Where do visitors come from?                     | Session source/medium, channel and campaign                                        | Search, referrals, social, direct and consistently tagged campaigns.                                              |
| Which content attracts interest?                 | Page title/path, landing pages, engagement                                         | GA engagement measures foreground activity, not every minute a tab is open.                                       |
| Which resources are opened?                      | `document_open`, file metadata and Document label                                  | A click or viewer navigation; not proof of a completed download or reading.                                       |
| Which application links are selected?            | `form_link_click`, Application link label/path and Link placement                  | Intent to open Google Forms, not a confirmed application.                                                         |
| How do visitors contact YIA?                     | `contact_click` and Contact method                                                 | Email/phone link clicks; neither the recipient nor phone number is sent in custom events.                         |
| Which translations are used?                     | `language_change` and Selected language                                            | The language selected in the site's translation menu.                                                             |
| Which devices and browsers are used?             | Device category, Browser and Operating system by Active users                      | Automatically collected technology categories; useful for prioritizing website testing.                           |
| Where and in what language is the site accessed? | Country, City and Language by Active users                                         | Approximate access location and browser language; not nationality, residence or the site's translation selection. |
| How far do people browse?                        | `scroll_depth` and Scroll depth                                                    | 25/50/75/90% of page height reached, at most once per pathname visit, after scrolling.                            |
| Which sections are selected?                     | `section_navigation` and Section label                                             | Table-of-contents link selection, not proof that a section was read.                                              |
| Which embedded videos are opened?                | `video_open` and Video label                                                       | Playback requested from the facade button; not watch duration or completion.                                      |
| Do contact forms succeed?                        | `contact_form_start`, `contact_form_submit`, `contact_form_error`, `generate_lead` | Start, attempt, fixed failure type, and confirmed successful response respectively.                               |

The existing contact-form component still points to `YOUR_FORM_ID` and needs a
real submission destination before it can receive inquiries. Analytics does not
configure Formspree or authorize a paid form service. Google Forms responses
should be counted in Google Forms separately; this website cannot see activity
after a visitor leaves for a hosted form. Do not report clicks as registrations.

Automatic Enhanced Measurement is enabled for page views (including browser
history changes), 90% scroll, outbound clicks, site search, forms, video and file
download clicks. Some automatic events need compatible page markup. In particular,
the current video facade does not promise full automatic YouTube watch tracking;
the custom `video_open` event covers opening it. Do not add manual page views
alongside the automatic history-based collection.

## Account configuration

The signed-in YIA Website property has 14-month event retention, the maximum
available on standard GA4. Aggregated standard reports are not limited by this
event-retention setting in the same way as detailed explorations. The following
event-scoped custom dimensions have been registered:

| Display name           | Event parameter     |
| ---------------------- | ------------------- |
| Document label         | `document_label`    |
| Application link label | `link_label`        |
| Link placement         | `link_placement`    |
| Application form path  | `form_path`         |
| Selected language      | `selected_language` |
| Section label          | `section_label`     |
| Video label            | `video_label`       |
| Contact method         | `method`            |
| Scroll depth           | `percent_scrolled`  |

Existing built-in dimensions cover page paths, traffic sources, devices,
approximate geography, link domains and file metadata. These custom dimensions
use nine of the standard property's 50 event-scoped slots. Allow processing time
after collection begins; custom definitions do not reconstruct prior history.
`generate_lead` is registered as a code-based key event, counted once per event,
with no default monetary value. It is emitted only on a successful form response.

Email-address redaction is enabled. Query-value redaction covers these 18 keys:
`email`, `email_address`, `name`, `first_name`, `last_name`, `firstname`,
`lastname`, `full_name`, `phone`, `phone_number`, `mobile`, `address`, `message`,
`token`, `access_token`, `auth`, `code`, `password`. Campaign parameters remain
available. These rules are best-effort, not a guarantee that every possible URL
key is safe. Add any new sensitive key before publishing a link; Google Forms
prefill keys such as `entry.123` must be considered individually.

Custom events never read form answers or input values and omit URL queries and
fragments. Public labels are bounded to 100 characters and redact email patterns.
Review the privacy notice and audience-appropriate consent before public rollout.
Advertising profiles, user-provided personal data and ad-platform links are not
needed for these reports. Staff traffic should first be tested with a filter in
Testing mode; activating an exclusion permanently drops matching future data.

On 7 October 2026, Property details confirmed **Japan / GMT+09:00** as the
reporting time zone and Japanese yen as the display currency; neither was changed.
The existing `Internal Traffic` exclusion remains in **Testing**. The new
`YIA Developer Testing` developer-traffic exclusion was created in **Testing**
and its saved state verified. It labels future debug-mode/debug-event traffic
through the built-in **Test data filter name** dimension; it does not remove
traffic from reports. Neither filter is Active. No staff IP addresses were added.

For future verification, enable debug mode only on the tester's browser through
Tag Assistant. In a private exploration, use Test data filter name and Event name
as rows, Event count as the value, and filter to `YIA Developer Testing`. Allow
24–36 hours for a new filter to apply and validate ordinary traffic separately.
Staff-office exclusions additionally need the correct approved public IP rules.
Keep these filters in Testing until their matches have been reviewed; do not
activate a permanent exclusion merely to make a launch report look cleaner.

## Client reporting

Start with the published native GA4 dashboard
[YIA サイトの利用状況](https://analytics.google.com/analytics/web/#/a411111889p557873278/reports/builder/16057323333),
available under レポート → カスタム ダッシュボード. It uses Japanese titles and descriptions, with
two equal-width scorecards (Active users and Sessions) across the top, then an
aligned row of traffic channels by Sessions and page titles/URLs by Views, followed by
document labels and application labels by Event count. Sources and actions use
horizontal bars. **人気ページとURL（表示回数）** uses a
three-column table: Page title, Page location and Views, with wrapping titles/URLs
and shaded count bars. Its search row, totals row and concept selectors are hidden.
The page table was checked with actual Japanese titles after processed rows
appeared, and its row was enlarged to keep the names readable. Cards share equal
widths and matching heights within each row.
The titles state the count's meaning; application interest explicitly says it is
not completion. Metric selectors on the scorecards are hidden to keep their
meaning stable for readers. Application and document cards have their own
event-name filters; they do not filter the traffic totals. The two event filters
currently use **contains the full event name**, because GA's exact-value selector
has no processed values yet. Do not introduce other event names containing
`form_link_click` or `document_open` without reviewing these filters.

The default Reports snapshot has Active users, New users, Sessions and Views at
the top. Its three cards show new/returning users, session channels and page titles
with Views; the wide five-column page table and truncated engagement-time headline
were replaced. The
[client quickstart](client-analytics-quickstart.md) explains date selection, empty
data, terminology and the difference between interest and completed applications.
Both reports were saved on 7 October 2026; no access permissions were changed.
The dashboard was reloaded and all six card titles, aligned placement and
application/document filters verified in the reader view. The saved snapshot
was also inspected in its reader view. The launch-day date selection was preserved.
Processed page rows and a `定款` document label appeared during the visual review;
these preliminary counts include launch verification and do not establish
complete action or campaign-attribution acceptance.
The visual review used the normal desktop viewport; mobile dashboard layout has
not been verified. Account reporting changes require no website deployment,
Vercel rebuild or cache refresh.

On 7 October 2026, Page location was added to the existing popular-pages table,
then saved and reloaded in the reader view. Actual page titles, full `https://yia.jp/`
addresses and view counts were checked together at the normal desktop viewport.
The URL cells are selectable text with no anchor elements; do not promise one-click
website navigation. Readers can copy a URL into a browser tab. Lower rows remain
accessible by scrolling inside the table. No new event, definition, dashboard,
collection setting or website deployment was needed.

Page location includes protocol, hostname, path and collected query string, subject
to the existing redaction settings. Campaign/debug/query variants can split the
same content into several rows, so this card reports exact title/URL combinations.
The Reports snapshot retains its title-only page table for totals across URL
variants. Renamed titles and slugs remain in historical data; newly published
public Sanity pages need no URL allowlist or manual report registration.

Keep the two client dashboards organized by their recurring question: **YIA サイトの利用状況**
covers site performance, content and actions; **YIA 利用者の傾向**
covers device, geographic and language patterns. Use standard detailed reports
or explorations for investigations. Create another dashboard only when a distinct
recurring decision or audience needs it, and avoid one dashboard per metric/page.
Both dashboards have six cards, below the standard property's 15-card limit per
dashboard. More dashboard pages do not improve collection or Vercel limits.

### Audience dashboard

The published
[YIA 利用者の傾向](https://analytics.google.com/analytics/web/#/a411111889p557873278/reports/builder/16057494145)
was added on 7 October 2026 to the existing **Custom dashboards** collection
(`16057176307`). The website overview retains its original six cards. No access
permissions, collection settings, paid features or website code were changed.

All six audience cards use **Active users** and existing built-in dimensions:

| Card title                   | Dimension        | Layout       |
| ---------------------------- | ---------------- | ------------ |
| 端末の種類（利用者数）       | Device category  | Top left     |
| 国・地域（利用者数）         | Country          | Top right    |
| 都市の目安（利用者数）       | City             | Middle left  |
| ブラウザー（利用者数）       | Browser          | Middle right |
| 端末の基本ソフト（利用者数） | Operating system | Bottom left  |
| ブラウザーの言語（利用者数） | Language         | Bottom right |

The cards are equal-width horizontal bars in three aligned rows, with matching
heights and one metric per card. Their dimensions have no event filter or fixed
page/slug list. Every measured public page, including new Sanity pages, contributes
automatically. No new event-scoped custom definition is necessary. Keep the
built-in Language dimension distinct from the site's custom Selected language.

Country and City describe approximate access location derived from IP information.
They do not identify a person's address, residency or nationality; this setup
does not request GPS. VPNs and network routing can affect inferred geography.
One measured user can appear in several categories or cities within a period, so
category rows and cards should not be summed into an overall unique-user total.
`(not set)` denotes unavailable values; regional collection controls and applicable
data thresholds can also limit detail. Do not weaken privacy settings to fill a
card. Age, gender and interests require additional advertising-demographic
collection for websites and are outside this dashboard; Google signals was not
enabled as part of this change.

For deeper investigation, use the standard Tech details report's screen-resolution
and device dimensions, or Demographic details with Region for prefecture/state
breakdowns where data is available. Use the same Japan-time dates as the overview,
allow normal processing, and avoid interpreting small launch-day samples as a
representative audience. The dashboard was saved, reloaded and checked with
actual device, country, city, browser, OS and language rows in the reader view.
All six cards fit the normal desktop viewport. Launch-day dates were preserved;
the client quickstart explains labels and practical uses.

### Japanese client handoff

On 7 October 2026, both published dashboard names, all twelve card headings and
their report descriptions were saved in Japanese. The report IDs and collection
remain unchanged. The website scorecards are **訪問者数** and **訪問回数**;
the application card is **申込リンクを開いた回数（申込完了ではありません）**.
The Reports snapshot's library name is now **サイトの利用状況**, with a Japanese
description; its native reader heading remains レポートのスナップショット.
All six cards on each client dashboard were checked in saved reader views at
the normal desktop viewport, with their Japanese sidebar entries visible.

Google's dimension values (such as `mobile`, `Japan`, `Japanese` and `Direct`),
software names and collected public labels retain their source spelling. This
edit does not remap historical data or promise that all raw values can be
translated inside a native chart. The Japanese-only client quickstart includes
a short glossary, account/access guidance, date selection, exact report names
and a ready-to-share onboarding paragraph. Readers need existing property
access; a direct link does not grant access. No invitations were sent.

This handoff polish changes account presentation and documentation only. There
are no new website requests, events, definitions, deployments or Vercel changes.
Earlier privacy/consent, live-action and processed-campaign acceptance checks,
Search Console ownership and the real contact-form destination remain separate
unresolved setup obligations; this visual review does not mark them complete.

### Action analysis and review periods

The saved private exploration
[YIA — Client action overview](https://analytics.google.com/analytics/web/#/analysis/a411111889p557873278/edit/9ucEP1KASwuF7pHh3955og)
contains three tabs, with Event count and Total users as values:

| Tab                  | Rows                                         | Event filter                         |
| -------------------- | -------------------------------------------- | ------------------------------------ |
| Actions by page      | Event name, Page path and screen class       | The eleven custom action event names |
| Documents opened     | Page path and screen class, Document label   | `document_open`                      |
| Application interest | Page path, Application link label, placement | `form_link_click`                    |

It defaults to the past 28 days and up to 50 rows. Change the date range for a
monthly review and export results manually when needed. It is saved in the
current account; no client invitations or sharing permissions were changed.
Collection started with the live deployment on 7 October 2026. Earlier visits are
not backfilled; regular reports and custom fields need processing time.

Report dates use Japan time. Wait at least 48 hours after month end, then use the
same full calendar month and compare with the previous measured month. October
2026 is partial from the 7th; November is the first full measured calendar month.
Do not compare October with unmeasured September. Realtime usually updates within
minutes and standard intraday data typically in 2–6 hours, but processing can take
24–48 hours and recent data can change. Newly registered custom fields also need
processing time. For a settled short-term report, omit the latest two days.
Keep traffic totals separate from action counts. A useful monthly review includes:

1. Active users, sessions, page views and engagement rate.
2. Leading sources/mediums and campaign names.
3. Top landing pages and program pages by views and engaged users.
4. Application-link clicks and document opens by label, page and placement.
5. Contact methods and confirmed inquiries, when a real form is configured.
6. Selected languages, device category and approximate countries.
7. Scroll-depth distribution and frequently selected sections/videos.

Standard traffic and page reports cover items 1–3 and 6. In a free-form exploration,
add Event name, Page path and screen class, and the custom dimension relevant to
the question. Use Event count and Total users as values, with an event-name filter
for the action being analyzed. For example, filter to `document_open` and use
Document label as rows, or filter to `form_link_click` and use Application link
label and Link placement. Raw event counts include repeat clicks; Total users
answers how many measured users selected an action.

A funnel can use a program-page `page_view` followed by `form_link_click`. Its
final step means application interest. A separate contact funnel can use
`contact_form_start` → `contact_form_submit` → `generate_lead` after a real form
is configured. Only confirmed successful inquiries should use `generate_lead`
as a success key event. Do not use automatic `form_submit` as proof of backend
acceptance.

Search Console is a further free source for Google-search queries, impressions,
clicks and search performance. Linking requires the correct verified website
property and appropriate ownership. Do not create a different site's property,
change DNS or grant new access solely to finish a report.
The signed-in account currently has no verified Search Console property available
to link. Website ownership verification or access from the existing verified
owner remains a prerequisite; no link was created.

## Campaign links

Use lowercase, consistent UTM values on links **into** the site, including QR
codes. Do not put names, emails or application answers into campaign values, and
do not tag internal navigation.

| Channel          | `utm_source`     | `utm_medium` | Example `utm_campaign` |
| ---------------- | ---------------- | ------------ | ---------------------- |
| Instagram        | `instagram`      | `social`     | `japan_festival_2026`  |
| Newsletter       | `yia_newsletter` | `email`      | `japan_festival_2026`  |
| Printed flyer QR | `event_flyer`    | `qr`         | `japan_festival_2026`  |

Example: `https://yia.jp/events/japan-festival?utm_source=instagram&utm_medium=social&utm_campaign=japan_festival_2026`.
Use `utm_content` to distinguish placements or versions when needed.
The custom `qr` medium may fall into the default channel group's **Unassigned**
bucket. Analyze it by Session source/medium and Session campaign rather than
assuming the traffic-channel chart will show a separate QR category. Keep QR as
a consistent, documented medium; do not mislabel printed flyers as paid social.

## Applying Google Analytics best practices

The 7 October 2026 review applies Google's guidance to YIA's actual questions:

| Practice                              | YIA implementation and next check                                                                                                                                                                                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start with useful questions           | The six-card website overview answers audience size, sources, content interest and actions. The separate audience dashboard covers devices, approximate location and browser language. Review comparable monthly periods; use standard reports or explorations for deeper analysis. |
| Define outcomes accurately            | Application clicks and document opens are interest. Only a confirmed successful inquiry emits `generate_lead`; measure external Google Forms completions separately. A real contact-form destination is still required.                                                             |
| Keep collection consistent            | One production tag and automatic browser-history page views cover public Sanity pages. New pages need clear titles and the normal publishing flow. Routing/template changes require checks for duplicate views, newly published routes and blocked telemetry.                       |
| Use stable, limited event fields      | Reuse the eleven defined actions and nine bounded, public custom dimensions when their meaning fits. Avoid a new event per page or personal identifiers. Register report fields and revise dashboard filters together when meanings change.                                         |
| Make campaigns comparable             | Use consistent lowercase UTM source/medium/campaign values on incoming campaign links. Keep internal links untagged, validate delivery, then inspect processed attribution after the reporting delay.                                                                               |
| Separate testing from client outcomes | Preview/local/Studio collection is excluded. Internal and developer filters remain in Testing; verify their matches before any permanent exclusion. Launch-day checks are not client conversions.                                                                                   |
| Protect data and respect choices      | URL email/query redaction and safe custom fields are already configured. Review new query keys, titles and labels for personal data; redaction is best-effort. The privacy/consent review remains an explicit prerequisite, not a completed compliance claim.                       |
| Compare complete periods              | Use Japan time and measured, comparable date ranges after processing. Note partial launch data, small counts and campaign/content changes; treat browser user counts as estimates.                                                                                                  |
| Add only relevant integrations        | Search Console remains a useful free extension after verified ownership is available. Ads profiles, sign-in User-ID collection, cross-domain tagging and paid exports are not needed for the current public-site questions.                                                         |

This sweep changed only GA reporting/filter settings and the reporting guides.
Website runtime, Vercel configuration, Sanity data and cache behavior were unchanged.
The earlier rollout/privacy, live custom-action and processed-campaign checks
retain their original task obligations; this account visual review does not close them.

## Rollout verification

Account configuration does not publish website code. After an authorized Vercel
deployment, verify GA4 Realtime/DebugView with real public-site actions, one page
view per navigation, document previews and normal links, translation, and scroll
milestones resetting between pages. Verify that content and actions still work
when Google telemetry is blocked. Check a tagged campaign visit. Allow normal
report processing time; a tag-installation test alone is not the full acceptance
check. Google Forms completions are outside this site's collection boundary.

On 7 October 2026, revision `235775ce3a2c09deebafb4f091e6951ab4689974`
was pushed and Vercel deployment `dpl_H8JsNqNvd5ucJ8aPhd8WkG8yevNQ` reached
**Ready**, aliased to `https://yia.jp` and `https://www.yia.jp`. Its build
prerendered ordinary public pages. Google Tag Assistant confirmed the correct
destination and direct `https://www.google-analytics.com/g/collect` hits:
one initial page view and one history-navigation view from home to the Sanity
conversation-salon page, a footer `document_open` labeled `定款`, per-page scroll
events, section navigation and an in-page document-preview open. GA4 Realtime
subsequently showed live visitors, page views, `document_open` and `scroll_depth`.
Selecting English also produced `language_change` in Realtime. A separately
tagged public event-page visit delivered a `page_view` with its non-personal
`utm_source`, `utm_medium` and `utm_campaign` intact; processed campaign attribution
still needs report processing time.
These test visits are part of the launch-day data, not real client outcomes.

Chrome DevTools temporarily blocked `www.googletagmanager.com` and
`*.google-analytics.com`. The tag-loader rule recorded two affected requests;
the public cooking page loaded, navigation to conversation salon worked and its
schedule PDF preview opened. The test rules were removed, blocking was disabled
and normal browsing restored afterward. The missing/failing Google helper and
production-only layout are also covered by unit tests. Live verification of
every custom action remains separate; no hosted application form or inquiry was
submitted during these checks.
The privacy/consent review and Search Console ownership prerequisite remain open.

The Vercel project Usage view inspected on 7 October showed the preceding
30-day window (6 September–6 October): 196,800 CDN requests, 50,569 ISR writes,
10,224 function invocations, 2,475 Web Analytics events and 4,849 Speed Insights
data points. Each was below the allowance shown for Hobby. This is a dated usage
snapshot, not a promise that future traffic or unrelated projects cannot reach
limits. No Vercel plan or quota setting was changed.
The team-wide Usage view also showed Hobby and usage below its displayed
allowances for the 6 September 20:00–6 October 20:00 window: about 196,000 CDN
requests, 48,000 ISR writes, 2,500 Web Analytics events and 4,900 Speed Insights
points. These rounded team totals use a different time boundary from the project
snapshot above.

## Keeping analytics aligned with development

Review this contract for changes to public routes, templates or interactions;
the mandatory workflow is in `AGENTS.md` and the coding-agent runbook.

| Website change                             | Tracking and reporting work                                                                                                                                                                                                                                                                                          |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New Sanity page, blog post or announcement | Publish through the normal content flow; navigation pages must belong to public navigation. Keep the route in `(site)` and support slugs absent from `generateStaticParams`. No new tag, custom dimension, cache schedule or report allowlist is needed. Verify its title/path and inherited tracking.               |
| Renamed page or changed slug               | Automatic title/path reports update on future visits. History retains old titles/paths; compare both when assessing a rename. Avoid a fixed URL filter that excludes future pages.                                                                                                                                   |
| New resource or application link           | Reuse `document_open` or `form_link_click` when the meaning matches. Preserve original file metadata, a public label and placement. Review classifier support when changing form hosts or viewer behavior.                                                                                                           |
| New button, dialog or template renderer    | A delegated link listener cannot infer every button action. Add an explicit shared-helper event only for a meaningful new action; ensure the same user action is counted once. Test previews, nested targets and route changes.                                                                                      |
| New form or registration flow              | Record starts/attempts/failures and emit success only after confirmed acceptance. Update key events and client wording. A redirect or external-form click is interest; never label it a registration.                                                                                                                |
| New parameter or changed event meaning     | Add a bounded public value, register its event-scoped dimension if needed, update this event/field table and the affected dashboard or exploration. Prefer a new event name for a materially different meaning so history stays interpretable. Do not reuse full-name substrings matched by existing report filters. |
| Routing or telemetry-library change        | Preserve production-only collection, Studio/PDF exclusions, one tag and one page-view owner. Verify new and post-build routes, scroll reset and blocked telemetry. Check build caching and Vercel usage before reporting completion.                                                                                 |

In the change's acceptance note, state **Analytics impact**, **GA account/report
updates** and **Verification**. “No change needed” is acceptable with a concrete
reason, such as ordinary content using existing templates. If account access is
missing, record the exact pending definition/filter update and keep it open.
Do not silently complete a task whose new measurement cannot appear in reports.
Do not create dashboards with unbounded per-person dimensions, personal form
contents or private URLs. Maintain the free-only constraints above.

## Official references

- [Google Analytics standard offering](https://marketingplatform.google.com/about/analytics/)
- [Get more useful data out of Analytics](https://support.google.com/analytics/answer/13126420?hl=en)
- [Native GA4 dashboards](https://support.google.com/analytics/answer/17217303?hl=en)
- [Built-in page URL/title dimensions](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#dimensions)
- [Tech details report](https://support.google.com/analytics/answer/12980150?co=GENIE.Platform%3DDesktop&hl=en)
- [Demographic details report](https://support.google.com/analytics/answer/12948931?co=GENIE.Platform%3DDesktop&hl=en)
- [Granular location and device collection controls](https://support.google.com/analytics/answer/12017362?hl=en)
- [Single-page application measurement](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications)
- [Avoid sending personal information](https://support.google.com/analytics/answer/6366371?hl=en)
- [Developer traffic filters](https://support.google.com/analytics/answer/13296662?hl=en)
- [Data freshness](https://support.google.com/analytics/answer/11198161?hl=en)
- [GA4 configuration limits](https://support.google.com/analytics/answer/12229528?hl=en)
- [Enhanced Measurement](https://support.google.com/analytics/answer/9216061?hl=en)
- [Custom dimensions](https://support.google.com/analytics/answer/14239696?hl=en)
- [Data retention](https://support.google.com/analytics/answer/7667196?hl=en)
- [Data redaction](https://support.google.com/analytics/answer/13544947?hl=en)
- [Campaign tagging](https://support.google.com/analytics/answer/10917952?hl=en)
- [Default channel definitions](https://support.google.com/analytics/answer/9756891?hl=en)
- [Search Console linking](https://support.google.com/analytics/answer/10737381?hl=en)
- [Vercel Web Analytics pricing and limits](https://vercel.com/docs/analytics/limits-and-pricing)
