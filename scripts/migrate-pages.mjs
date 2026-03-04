import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, '..', 'data', 'site-data.json');

const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

// Extract the three pages to convert
const { aboutPage, membershipPage, directoryPage, programPages, ...rest } = data;

// --- Convert aboutPage → page ---
const categoryMap = {
  support: { ja: '支援事業', en: 'Support Services' },
  educational: { ja: '啓発事業', en: 'Educational Programs' },
  exchange: { ja: '交流事業', en: 'Cultural Exchange' },
  contribution: { ja: '国際貢献', en: 'International Contribution' },
  other: { ja: 'その他', en: 'Other' },
};

const activitiesRows = Object.entries(aboutPage.businessActivities)
  .filter(([, items]) => items && items.length > 0)
  .map(([key, items]) => ({
    labelJa: categoryMap[key].ja,
    labelEn: categoryMap[key].en,
    valueJa: items.join('、'),
  }));

// Parse governance lines
const govJaLines = aboutPage.governance.ja.split('\n').filter(l => l.trim());
const govEnLines = aboutPage.governance.en.split('\n').filter(l => l.trim());
const governanceItems = govJaLines.map((jaLine, i) => {
  const [termJa, ...restJa] = jaLine.split('：');
  const definitionJa = restJa.join('：');
  const enLine = govEnLines[i] || '';
  const [termEn, ...restEn] = enLine.split(': ');
  const definitionEn = restEn.join(': ');
  return { termJa: termJa.trim(), definitionJa: definitionJa.trim(), termEn: termEn.trim(), definitionEn: definitionEn.trim() };
});

const aboutPageConverted = {
  id: 'aboutyia',
  slug: 'aboutyia',
  template: 'organization-overview',
  titleJa: aboutPage.titleJa,
  titleEn: aboutPage.titleEn,
  _type: 'page',
  sections: [
    {
      _type: 'content',
      titleJa: '私たちの理念',
      titleEn: 'Our Mission',
      descriptionJa: aboutPage.missionJa,
      descriptionEn: aboutPage.missionEn,
    },
    {
      _type: 'infoTable',
      titleJa: '団体概要',
      titleEn: 'Organization Overview',
      rows: [
        { labelJa: '設立', labelEn: 'Founded', valueJa: aboutPage.orgDetails.founded },
        { labelJa: 'NPO認定', labelEn: 'NPO Established', valueJa: aboutPage.orgDetails.npoEstablished },
        { labelJa: '会員数', labelEn: 'Members', valueJa: aboutPage.orgDetails.members, valueEn: aboutPage.orgDetails.membersEn },
        { labelJa: '職員', labelEn: 'Staff', valueJa: aboutPage.orgDetails.staff, valueEn: aboutPage.orgDetails.staffEn },
      ],
    },
    {
      _type: 'infoTable',
      titleJa: '事業内容',
      titleEn: 'Activities',
      rows: activitiesRows,
    },
    {
      _type: 'history',
      titleJa: 'あゆみ',
      titleEn: 'Our History',
      columns: ['年', '出来事'],
      columnsEn: ['Year', 'Event'],
      years: aboutPage.history.map(h => ({ year: h.year, cuisines: h.eventJa })),
    },
    {
      _type: 'boardMembers',
      titleJa: '役員一覧',
      titleEn: 'Board Members',
      asOf: aboutPage.boardMembers.asOf,
      members: aboutPage.boardMembers.members,
    },
    {
      _type: 'definitions',
      titleJa: '運営',
      titleEn: 'Governance',
      items: governanceItems,
    },
  ],
};

// --- Convert membershipPage → page ---
const membershipPageConverted = {
  id: 'kaiinn',
  slug: 'kaiinn',
  template: 'membership',
  titleJa: membershipPage.titleJa,
  titleEn: membershipPage.titleEn,
  descriptionJa: membershipPage.descriptionJa,
  descriptionEn: membershipPage.descriptionEn,
  ...(membershipPage.images ? { images: membershipPage.images } : {}),
  _type: 'page',
  sections: [
    {
      _type: 'feeTable',
      titleJa: '年会費のご案内',
      titleEn: 'Membership Fees',
      rows: membershipPage.feeTable,
    },
    {
      _type: 'infoTable',
      titleJa: '会員種別',
      titleEn: 'Member Types',
      rows: membershipPage.memberTypes.map(mt => ({
        labelJa: mt.typeJa,
        valueJa: mt.descriptionJa,
      })),
    },
    {
      _type: 'content',
      titleJa: '会員になると',
      titleEn: 'Member Benefits',
      descriptionJa: membershipPage.benefits.ja,
      descriptionEn: membershipPage.benefits.en,
    },
    {
      _type: 'content',
      titleJa: '入会のお申込み',
      titleEn: 'How to Join',
      descriptionJa: membershipPage.registrationProcess,
      documents: membershipPage.registrationForms,
      infoTable: [
        { labelJa: '銀行', labelEn: 'Bank', valueJa: membershipPage.bankTransfer.bank, valueEn: membershipPage.bankTransfer.bankEn },
        { labelJa: '口座番号', labelEn: 'Account', valueJa: membershipPage.bankTransfer.accountNumber },
        { labelJa: '口座名義', labelEn: 'Holder', valueJa: membershipPage.bankTransfer.accountHolder },
      ],
    },
    {
      _type: 'otherNotes',
      ja: membershipPage.privacyNotice.ja,
      en: membershipPage.privacyNotice.en,
    },
  ],
};

// --- Convert directoryPage → page ---
const directoryPageConverted = {
  id: 'sanjyokaiin',
  slug: 'sanjyokaiin',
  template: 'directory',
  titleJa: directoryPage.titleJa,
  titleEn: directoryPage.titleEn,
  subtitleJa: directoryPage.subtitle,
  descriptionJa: directoryPage.descriptionJa,
  descriptionEn: directoryPage.descriptionEn,
  _type: 'page',
  sections: [
    {
      _type: 'directoryList',
      titleJa: '賛助会員一覧',
      titleEn: 'Supporting Members Directory',
      entries: directoryPage.entries,
    },
  ],
};

// --- Update programPages: rename key to "pages" and change _type ---
const updatedPages = programPages.map(page => ({
  ...page,
  _type: 'page',
}));

// Add the 3 converted pages
updatedPages.push(aboutPageConverted);
updatedPages.push(membershipPageConverted);
updatedPages.push(directoryPageConverted);

// Build new data object (without aboutPage, membershipPage, directoryPage, programPages)
const newData = {
  ...rest,
  pages: updatedPages,
};

writeFileSync(dataPath, JSON.stringify(newData, null, 2) + '\n', 'utf-8');

console.log('Migration complete!');
console.log(`Total pages: ${updatedPages.length}`);
console.log(`Converted pages: aboutyia, kaiinn, sanjyokaiin`);
console.log(`All programPage _type fields changed to "page"`);
