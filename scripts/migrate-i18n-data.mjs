import { readFileSync, writeFileSync } from "fs";

const FILE = new URL("../data/site-data.json", import.meta.url).pathname;

const data = JSON.parse(readFileSync(FILE, "utf-8"));
let changeCount = 0;

// ── Helpers ──────────────────────────────────────────────────────────

function makeI18n(ja, en, easy) {
  const arr = [];
  if (ja) arr.push({ _key: "ja", value: ja });
  if (en) arr.push({ _key: "en", value: en });
  if (easy) arr.push({ _key: "easy", value: easy });
  return arr.length ? arr : undefined;
}

function bilingualToI18n(obj) {
  if (!obj) return undefined;
  return makeI18n(obj.ja, obj.en);
}

function migrateField(obj, oldJa, oldEn, newName, oldEasy) {
  if (!obj) return;
  const ja = obj[oldJa];
  const en = obj[oldEn];
  const easy = oldEasy ? obj[oldEasy] : undefined;
  const result = makeI18n(ja, en, easy);
  if (result) {
    obj[newName] = result;
    changeCount++;
  }
  delete obj[oldJa];
  delete obj[oldEn];
  if (oldEasy) delete obj[oldEasy];
}

function migrateFieldAlt(obj, oldLabel, oldLabelEn, newName) {
  if (!obj) return;
  const ja = obj[oldLabel];
  const en = obj[oldLabelEn];
  const result = makeI18n(ja, en);
  if (result) {
    obj[newName] = result;
    changeCount++;
  }
  if (newName !== oldLabel) delete obj[oldLabel];
  delete obj[oldLabelEn];
}

// ── 1. site.org ──────────────────────────────────────────────────────

migrateField(data.site?.org, "nameJa", "nameEn", "name");
migrateField(data.site?.org, "descriptionJa", "descriptionEn", "description");

// ── 2. site.contact ──────────────────────────────────────────────────

migrateField(data.site?.contact, "addressJa", "addressEn", "address");

// ── 3. site.businessHours ────────────────────────────────────────────

if (data.site?.businessHours) {
  const bh = data.site.businessHours;
  const result = bilingualToI18n(bh);
  if (result) {
    data.site.businessHours = result;
    changeCount++;
  }
}

// ── 4. categories ────────────────────────────────────────────────────

for (const cat of data.categories ?? []) {
  migrateField(cat, "labelJa", "labelEn", "label");
}

// ── 5. navigation.categories[].items[] ───────────────────────────────

for (const navCat of data.navigation?.categories ?? []) {
  for (const item of navCat.items ?? []) {
    migrateField(item, "titleJa", "titleEn", "title", "titleEasy");
  }
}

// ── 6. navigation.orgLinks[] ─────────────────────────────────────────

for (const link of data.navigation?.orgLinks ?? []) {
  migrateField(link, "titleJa", "titleEn", "title");
}

// ── 7. announcements[] ───────────────────────────────────────────────

for (const ann of data.announcements ?? []) {
  migrateField(ann, "titleJa", "titleEn", "title");
  migrateField(ann, "contentJa", "contentEn", "content");

  // 8. announcements[].documents[]
  for (const doc of ann.documents ?? []) {
    migrateFieldAlt(doc, "label", "labelEn", "label");
  }
}

// ── 9. homepage.hero ─────────────────────────────────────────────────

migrateField(data.homepage?.hero, "taglineJa", "taglineEn", "tagline");

// ── 10. homepage.activityGrid.stat ───────────────────────────────────

migrateField(data.homepage?.activityGrid?.stat, "labelJa", "labelEn", "label");

// ── 11. pages[] ──────────────────────────────────────────────────────

function migrateImages(images) {
  for (const img of images ?? []) {
    migrateField(img, "captionJa", "captionEn", "caption");
  }
}

function migrateDocuments(docs) {
  for (const doc of docs ?? []) {
    migrateFieldAlt(doc, "label", "labelEn", "label");
  }
}

function migrateSection(section) {
  if (!section) return;
  const t = section._type;

  switch (t) {
    case "warnings":
      if (section.items) {
        section.items = section.items.map((item) => {
          const result = bilingualToI18n(item);
          if (result) changeCount++;
          return result ?? item;
        });
      }
      break;

    case "content":
      migrateField(section, "titleJa", "titleEn", "title");
      migrateField(section, "descriptionJa", "descriptionEn", "description");
      migrateField(section, "noteJa", "noteEn", "note");
      for (const row of section.infoTable ?? []) {
        migrateField(row, "labelJa", "labelEn", "label");
        migrateField(row, "valueJa", "valueEn", "value");
      }
      for (const item of section.checklist ?? []) {
        migrateField(item, "labelJa", "labelEn", "label");
        migrateField(item, "noteJa", "noteEn", "note");
      }
      migrateDocuments(section.documents);
      migrateImages(section.images);
      break;

    case "infoTable":
      migrateField(section, "titleJa", "titleEn", "title");
      for (const row of section.rows ?? []) {
        migrateField(row, "labelJa", "labelEn", "label");
        migrateField(row, "valueJa", "valueEn", "value");
      }
      if (section.appointmentNote) {
        const result = bilingualToI18n(section.appointmentNote);
        if (result) { section.appointmentNote = result; changeCount++; }
      }
      if (section.additionalLanguageNote) {
        const result = bilingualToI18n(section.additionalLanguageNote);
        if (result) { section.additionalLanguageNote = result; changeCount++; }
      }
      if (section.otherNotes) {
        const result = bilingualToI18n(section.otherNotes);
        if (result) { section.otherNotes = result; changeCount++; }
      }
      break;

    case "tableSchedule":
      migrateField(section, "titleJa", "titleEn", "title");
      break;

    case "groupSchedule":
      migrateField(section, "titleJa", "titleEn", "title");
      for (const group of section.groups ?? []) {
        migrateFieldAlt(group, "name", "nameEn", "name");
      }
      break;

    case "eventSchedule":
      migrateField(section, "titleJa", "titleEn", "title");
      for (const entry of section.entries ?? []) {
        migrateField(entry, "locationJa", "locationEn", "location");
        migrateField(entry, "descriptionJa", "descriptionEn", "description");
      }
      if (section.venue) {
        migrateField(section.venue, "locationJa", "locationEn", "location");
      }
      break;

    case "sisterCities":
      migrateField(section, "titleJa", "titleEn", "title");
      for (const city of section.cities ?? []) {
        migrateField(city, "nameJa", "nameEn", "name");
      }
      break;

    case "definitions":
      migrateField(section, "titleJa", "titleEn", "title");
      for (const item of section.items ?? []) {
        migrateField(item, "termJa", "termEn", "term");
        migrateField(item, "definitionJa", "definitionEn", "definition");
      }
      break;

    case "links":
      migrateField(section, "titleJa", "titleEn", "title");
      for (const item of section.items ?? []) {
        migrateField(item, "titleJa", "titleEn", "title");
      }
      break;

    case "history":
      migrateField(section, "titleJa", "titleEn", "title");
      migrateField(section, "introJa", "introEn", "intro");
      break;

    case "fairTrade":
      migrateField(section, "titleJa", "titleEn", "title");
      migrateField(section, "descriptionJa", "descriptionEn", "description");
      migrateField(section, "deliveryJa", "deliveryEn", "delivery");
      break;

    case "boardMembers":
      migrateField(section, "titleJa", "titleEn", "title");
      for (const member of section.members ?? []) {
        migrateField(member, "roleJa", "roleEn", "role");
      }
      break;

    case "feeTable":
      migrateField(section, "titleJa", "titleEn", "title");
      for (const row of section.rows ?? []) {
        migrateField(row, "typeJa", "typeEn", "memberType");
      }
      break;

    case "directoryList":
      migrateField(section, "titleJa", "titleEn", "title");
      break;

    case "gallery":
      migrateImages(section.images);
      break;

    case "flyers":
      break;

    default:
      if (section.titleJa || section.titleEn) {
        migrateField(section, "titleJa", "titleEn", "title");
      }
      break;
  }
}

for (const page of data.pages ?? []) {
  migrateField(page, "titleJa", "titleEn", "title", "titleEasy");
  migrateField(page, "subtitleJa", "subtitleEn", "subtitle");
  migrateField(page, "descriptionJa", "descriptionEn", "description", "descriptionEasy");
  migrateImages(page.images);

  for (const section of page.sections ?? []) {
    migrateSection(section);
  }
}

// ── Sidebar ──────────────────────────────────────────────────────────

const sb = data.sidebar;
if (sb) {
  migrateField(sb.accessMap, "labelJa", "labelEn", "label");
  migrateField(sb.youtubeLink, "labelJa", "labelEn", "label");
  migrateField(sb.memberRecruitment, "labelJa", "labelEn", "label", "labelEasy");
  migrateField(sb.activityRequestForm, "labelJa", "labelEn", "label");
  migrateField(sb.fairTrade, "labelJa", "labelEn", "label");

  for (const box of sb.resourceBoxes ?? []) {
    migrateField(box, "titleJa", "titleEn", "title", "titleEasy");
  }

  for (const doc of sb.documents ?? []) {
    migrateFieldAlt(doc, "label", "labelEn", "label");
  }
}

// ── Write result ─────────────────────────────────────────────────────

writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n", "utf-8");

console.log(`Migration complete. ${changeCount} fields converted to i18n format.`);
console.log(`Output written to ${FILE}`);
