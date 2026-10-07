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

| Question                              | Measurement                                                                        | Interpretation                                                                            |
| ------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| How many people visit?                | Active/new/returning users, sessions, views                                        | Browser-based estimates; cookies, consent and blockers affect counts.                     |
| Where do visitors come from?          | Session source/medium, channel and campaign                                        | Search, referrals, social, direct and consistently tagged campaigns.                      |
| Which content attracts interest?      | Page title/path, landing pages, engagement                                         | GA engagement measures foreground activity, not every minute a tab is open.               |
| Which resources are opened?           | `document_open`, file metadata and Document label                                  | A click or viewer navigation; not proof of a completed download or reading.               |
| Which application links are selected? | `form_link_click`, Application link label/path and Link placement                  | Intent to open Google Forms, not a confirmed application.                                 |
| How do visitors contact YIA?          | `contact_click` and Contact method                                                 | Email/phone link clicks; neither the recipient nor phone number is sent in custom events. |
| Which translations are used?          | `language_change` and Selected language                                            | The language selected in the site's translation menu.                                     |
| How far do people browse?             | `scroll_depth` and Scroll depth                                                    | 25/50/75/90% of page height reached, at most once per pathname visit, after scrolling.    |
| Which sections are selected?          | `section_navigation` and Section label                                             | Table-of-contents link selection, not proof that a section was read.                      |
| Which embedded videos are opened?     | `video_open` and Video label                                                       | Playback requested from the facade button; not watch duration or completion.              |
| Do contact forms succeed?             | `contact_form_start`, `contact_form_submit`, `contact_form_error`, `generate_lead` | Start, attempt, fixed failure type, and confirmed successful response respectively.       |

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

## Client reporting

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
The report is currently empty because the website changes have not been deployed.

Use the same full calendar month and compare with the previous month. Keep
traffic totals separate from action counts. A useful monthly review includes:

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

## Rollout verification

Account configuration does not publish website code. After an authorized Vercel
deployment, verify GA4 Realtime/DebugView with real public-site actions, one page
view per navigation, document previews and normal links, translation, and scroll
milestones resetting between pages. Verify that content and actions still work
when Google telemetry is blocked. Check a tagged campaign visit. Allow normal
report processing time; a tag-installation test alone is not the full acceptance
check. Live collection and real Google Forms completions have not been verified.

## Official references

- [Google Analytics standard offering](https://marketingplatform.google.com/about/analytics/)
- [GA4 configuration limits](https://support.google.com/analytics/answer/12229528?hl=en)
- [Enhanced Measurement](https://support.google.com/analytics/answer/9216061?hl=en)
- [Custom dimensions](https://support.google.com/analytics/answer/14239696?hl=en)
- [Data retention](https://support.google.com/analytics/answer/7667196?hl=en)
- [Data redaction](https://support.google.com/analytics/answer/13544947?hl=en)
- [Campaign tagging](https://support.google.com/analytics/answer/10917952?hl=en)
- [Search Console linking](https://support.google.com/analytics/answer/10737381?hl=en)
- [Vercel Web Analytics pricing and limits](https://vercel.com/docs/analytics/limits-and-pricing)
