import { fail, i18n, logSummary, patchWithRevision, runSanityScript } from "./lib/sanity-tools.mjs";

const SECTION_KEY = "p010-sister-city-link";
const CITY_CARDS_KEY = "key206";
const CITY_URL = "https://www.city.yokosuka.kanagawa.jp/0535/g_info/l100050650.html";

runSanityScript({
  name: "Apply P-010 sister city link",
  description: "Insert a titleless rich-text link block above the sister city image cards.",
  handler: async ({ client, dryRun }) => {
    const docs = await client.fetch(
      `*[_id in ["page-sistercity", "drafts.page-sistercity"]]{
        _id,
        _rev,
        sections
      }`,
    );

    let patched = 0;
    let skippedUnchanged = 0;
    const patchedDocs = [];

    for (const doc of docs ?? []) {
      const sections = upsertLinkSection(doc.sections ?? []);
      if (JSON.stringify(sections) === JSON.stringify(doc.sections ?? [])) {
        skippedUnchanged += 1;
        continue;
      }

      await patchWithRevision(client, doc, { sections }, { dryRun });
      patched += 1;
      patchedDocs.push(doc._id);
    }

    logSummary({
      dryRun,
      found: docs?.length ?? 0,
      patched,
      skippedUnchanged,
      patchedDocs,
    });
  },
});

function upsertLinkSection(sections) {
  const existingIndex = sections.findIndex((section) => section._key === SECTION_KEY);
  if (
    existingIndex >= 0 &&
    sectionMatches(sections[existingIndex]) &&
    sections[existingIndex + 1]?._key === CITY_CARDS_KEY
  ) {
    return sections;
  }

  const withoutExisting = sections.filter((section) => section._key !== SECTION_KEY);
  const targetIndex = withoutExisting.findIndex((section) => section._key === CITY_CARDS_KEY);
  if (targetIndex < 0) {
    throw fail("Could not find the sister city image cards section.", {
      fix: "Confirm the sister city page still has the expected imageCards section key.",
      context: { expectedKey: CITY_CARDS_KEY },
    });
  }

  const next = [...withoutExisting];
  next.splice(targetIndex, 0, linkSection());
  return next;
}

function sectionMatches(section) {
  const jaBody = section?.body?.find((entry) => entry._key === "ja")?.value ?? [];
  const firstBlock = jaBody[0];
  const linkMark = firstBlock?.markDefs?.find((mark) => mark._type === "link");
  const linkedText = firstBlock?.children?.find((child) =>
    child.marks?.includes(linkMark?._key),
  )?.text;

  return (
    section?._type === "content" &&
    section?.tocLevel === "hidden" &&
    linkedText === "姉妹都市の紹介はこちら" &&
    linkMark?.href === CITY_URL
  );
}

function linkSection() {
  return {
    _key: SECTION_KEY,
    _type: "content",
    title: i18n("", ""),
    tocLevel: "hidden",
    body: [
      {
        _key: "ja",
        value: [
          {
            _key: "p010-ja-block",
            _type: "block",
            style: "normal",
            markDefs: [{ _key: "p010-city-link", _type: "link", href: CITY_URL }],
            children: [
              {
                _key: "p010-ja-span",
                _type: "span",
                text: "姉妹都市の紹介はこちら",
                marks: ["p010-city-link"],
              },
            ],
          },
        ],
      },
      { _key: "en", value: [] },
    ],
  };
}
