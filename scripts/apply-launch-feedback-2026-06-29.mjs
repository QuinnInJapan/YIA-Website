#!/usr/bin/env node

import { fail, i18n, logSummary, patchWithRevision, runSanityScript } from "./lib/sanity-tools.mjs";

const PAGE_BASE_IDS = [
  "page-nihonbunka",
  "page-kids",
  "page-youthfo",
  "page-kaiwasalon",
  "page-gaikokugo",
  "page-kokusairikai",
  "page-englishguide",
  "page-cooking",
  "page-seikatsusodan",
  "page-honyaku",
  "page-bosai",
  "page-kokusaikoken",
  "page-sistercity",
  "page-aboutyia",
  "page-kaiinn",
];

const SINGLETON_BASE_IDS = ["homepage", "homepageFeatured", "category-classes"];

await runSanityScript({
  name: "Apply 2026-06-29 launch feedback",
  description: "Minimal Sanity content patches from the latest downloaded Word feedback doc.",
  async handler({ client, dryRun }) {
    const ids = [
      ...PAGE_BASE_IDS,
      ...PAGE_BASE_IDS.map((id) => `drafts.${id}`),
      ...SINGLETON_BASE_IDS,
      ...SINGLETON_BASE_IDS.map((id) => `drafts.${id}`),
      "announcement-disaster-volunteer-recruitment",
      "drafts.announcement-disaster-volunteer-recruitment",
    ];

    const docs = await client.fetch(`*[_id in $ids]`, { ids });
    const byId = new Map(docs.map((doc) => [doc._id, doc]));
    const patched = [];
    const skipped = [];

    async function patchDoc(doc, set, reason) {
      if (!doc) return;
      const changed = stableStringify(pickPatchSource(doc, set)) !== stableStringify(set);
      if (!changed) {
        skipped.push(`${doc._id}: ${reason}`);
        return;
      }
      await patchWithRevision(client, doc, set, { dryRun });
      patched.push(`${doc._id}: ${reason}`);
    }

    async function patchBase(baseId, transform) {
      for (const id of [baseId, `drafts.${baseId}`]) {
        const doc = byId.get(id);
        if (!doc) continue;
        const set = transform(structuredClone(doc), id);
        if (set) await patchDoc(doc, set, set.__reason ?? baseId);
      }
    }

    await patchBase("homepage", updateHomepageAnnouncements);
    await patchBase("homepageFeatured", updateHomepageFeaturedOrder);
    await patchBase("category-classes", updateClassesCategoryImage);
    await patchBase("page-nihonbunka", updateJapaneseCulture);
    await patchBase("page-kids", updateKidsFestival);
    await patchBase("page-youthfo", updateYouthForum);
    await patchBase("page-kaiwasalon", updateConversationSalon);
    await patchBase("page-gaikokugo", updateForeignLanguages);
    await patchBase("page-kokusairikai", updateGlobalUnderstanding);
    await patchBase("page-englishguide", updateEnglishGuide);
    await patchBase("page-cooking", updateCooking);
    await patchBase("page-seikatsusodan", updateCounseling);
    await patchBase("page-honyaku", updateTranslation);
    await patchBase("page-bosai", updateDisasterPrep);
    await patchBase("page-kokusaikoken", updateFairtrade);
    await patchBase("page-sistercity", updateSisterCity);
    await patchBase("page-aboutyia", updateAboutYia);
    await patchBase("page-kaiinn", updateMembership);
    await patchBase(
      "announcement-disaster-volunteer-recruitment",
      updateDisasterVolunteerAnnouncement,
    );

    logSummary({
      dryRun,
      patched: patched.length,
      skippedUnchanged: skipped.length,
    });
    if (patched.length) {
      console.log("\nPATCHED");
      for (const item of patched) console.log(`  ${item}`);
    }
    if (skipped.length) {
      console.log("\nUNCHANGED");
      for (const item of skipped) console.log(`  ${item}`);
    }
  },
});

function pickPatchSource(doc, set) {
  const picked = {};
  for (const key of Object.keys(set)) {
    if (key === "__reason") continue;
    picked[key] = doc[key];
  }
  return picked;
}

function stableStringify(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .filter((key) => key !== "__reason")
      .map((key) => [key, sortKeys(value[key])]),
  );
}

function updateHomepageAnnouncements(doc) {
  return withReason(
    {
      announcementRefs: [
        ref("announcement-website-renewal-2026", "launch-renewal"),
        ref("announcement-patchwork-sale", "patchwork-sale"),
        ref("announcement-disaster-volunteer-recruitment", "disaster-translation-volunteers"),
      ],
    },
    "curated homepage announcements",
  );
}

function updateHomepageFeaturedOrder() {
  return withReason(
    {
      categories: [
        ref("category-events"),
        ref("category-classes"),
        ref("category-services"),
        ref("category-partnerships"),
      ],
    },
    "homepage category card order",
  );
}

function updateClassesCategoryImage(doc) {
  const image = doc.heroImage;
  const cookingImage = {
    _type: "image",
    asset: {
      _type: "reference",
      _ref: "image-f0faccc2ec2342f0fb3b993d7bf609471803c779-1024x576-jpg",
    },
    crop: { _type: "sanity.imageCrop", bottom: 0, left: 0, right: 0, top: 0 },
    hotspot: {
      _type: "sanity.imageHotspot",
      height: 0.6312508691419829,
      width: 0.33413837609511865,
      x: 0.6646638376095119,
      y: 0.5013071895424837,
    },
  };
  return withReason(
    { heroImage: image?.asset?._ref === cookingImage.asset._ref ? image : cookingImage },
    "classes category hero image",
  );
}

function updateJapaneseCulture(doc) {
  let sections = structuredClone(doc.sections ?? []);
  const schedule = section(sections, "key121", "table");
  ensureFirstColumn(schedule, "program", "行事", "Program", [
    ["日本文化体験教室", "Japanese Culture Experience Class"],
    ["日本文化体験教室", "Japanese Culture Experience Class"],
    ["ジャパンフェスティバル イン よこすか", "Japan Festival in Yokosuka"],
  ]);
  setCell(schedule.rows[1], 2, "12:30〜16:30", "12:30-16:30");
  setCell(schedule.rows[1], 3, "総合福祉会館 6階", "Sogo Fukushi Kaikan 6F");

  const gallery = section(sections, "key124", "gallery");
  setCaption(gallery, "key125", "三味線", "Shamisen");
  setCaption(gallery, "key128", "甲冑隊", "Samurai Armor Team");
  setCaption(gallery, "key130", "着物", "Kimono");
  setCaption(gallery, "key131", "ステージ発表", "Stage Performance");

  sections = sections.filter((item) => item._key !== "key132");

  return withReason(
    {
      title: i18n(
        "日本文化体験教室&ジャパンフェスティバル イン よこすか",
        "Japanese Culture Experience Class & Japan Festival in Yokosuka",
      ),
      description: i18n(
        "生け花、折り紙、書道、着物の着付け、三味線など、日本の伝統文化を体験できるプログラムです。主に外国籍市民を対象に、日本文化に親しむ機会を提供しています。ジャパンフェスティバル イン よこすかでは、ステージ発表や展示なども行います。",
        "A hands-on program where participants can experience Japanese traditional culture such as ikebana, origami, calligraphy, kimono dressing, and shamisen. It mainly provides foreign residents with opportunities to enjoy Japanese culture. Japan Festival in Yokosuka also includes stage performances and exhibitions.",
      ),
      sections,
    },
    "Japanese culture/JFY title, description, schedule, captions, and removed duplicate JFY block",
  );
}

function updateKidsFestival(doc) {
  const sections = structuredClone(doc.sections ?? []);
  const schedule = section(sections, "key137", "labelTable");
  upsertRow(schedule.rows, "kids-location", "場所", "Venue", "ヴェルクよこすか", "Werk Yokosuka");
  return withReason(
    {
      description: replaceI18nText(doc.description, {
        歌コンテスト: "仮装コンテスト",
        "singing contests": "costume contests",
      }),
      sections,
    },
    "kids festival wording and venue",
  );
}

function updateYouthForum(doc) {
  const sections = structuredClone(doc.sections ?? []);
  const guide = section(sections, "key111", "labelTable");
  guide.title = i18n("2026年度スケジュール", "2026 Schedule");
  guide.rows = (guide.rows ?? []).filter((row) => row._key === "r8-youth-date");
  upsertRow(guide.rows, "youth-location", "場所", "Venue", "ヴェルクよこすか", "Werk Yokosuka");
  return withReason({ sections }, "youth forum schedule-only block");
}

function updateConversationSalon(doc) {
  let sections = structuredClone(doc.sections ?? []);
  const docs = section(sections, "key57", "links");
  docs.items = (docs.items ?? []).filter((item) => item._key !== "photos-pdf");

  const adultSogo = section(sections, "adult-sogo-schedule", "table");
  const photosColumnIndex = adultSogo.columns?.findIndex((col) => col._key === "photos") ?? -1;
  if (photosColumnIndex >= 0) {
    adultSogo.columns.splice(photosColumnIndex, 1);
    for (const row of adultSogo.rows ?? []) {
      row.fileCells = (row.fileCells ?? []).filter((file) => file.colKey !== "photos");
    }
  }

  upsertSectionAfter(sections, "adult-other-location-schedule", {
    _key: "potluck-link",
    _type: "links",
    title: i18n("ポットラック インターナショナル", "Potluck International"),
    items: [
      {
        _key: "potluck-website",
        type: "website",
        label: i18n("ポットラック インターナショナル", "Potluck International"),
        url: "https://yoshiefoot215mm.wixsite.com/potluckinternational",
      },
    ],
  });

  const youthSchedule = section(sections, "youth-schedule", "table");
  youthSchedule.title = i18n("こども・学生向けクラス", "Classes for Children and Students");
  const terakoya = rowByKey(youthSchedule.rows, "terakoya");
  if (terakoya) {
    setCell(terakoya, 0, "てらこやさん", "Terakoya-san");
    setCell(terakoya, 6, "", "");
  }
  upsertSectionAfter(sections, "youth-schedule", {
    _key: "terakoya-location-note",
    _type: "content",
    hideTitle: true,
    body: blocks(
      "○がついている日は別の場所で授業をします。先生に場所を聞いてください。",
      "Classes marked with ○ are held at a different location. Please ask the teacher for the location.",
    ),
  });

  return withReason(
    { sections },
    "conversation salon downloads, Potluck link, youth class title/name, and Terakoya note",
  );
}

function updateForeignLanguages(doc) {
  let sections = structuredClone(doc.sections ?? []);
  const guide = section(sections, "5816ea54-405", "labelTable");
  const period = rowByKey(guide.rows, "period");
  if (period)
    period.value = i18n(
      "1期12回（約3ヶ月程度）、年間3期",
      "12 lessons per term (about 3 months), 3 terms per year",
    );

  const classTable = section(sections, "class-details-2026-term1", "table", { required: false });
  const downloads = section(sections, "key100", "links");
  if (classTable) {
    for (const row of classTable.rows ?? []) {
      const file = row.fileCells?.find((cell) => cell.assetRef);
      if (!file) continue;
      const className = getI18n(row.cells?.[0], "ja");
      const englishName = getI18n(row.cells?.[0], "en");
      upsertLink(
        downloads.items,
        `${row._key}-flyer`,
        className,
        englishName,
        file.assetRef,
        file.filename,
      );
    }
    sections = sections.filter((item) => item._key !== "class-details-2026-term1");
  }

  const fees = section(sections, "fees-payment", "content");
  fees.body = blocks(
    "受講料の支払は、協会窓口か振込でお願いいたします。",
    "Please pay tuition at the association office or by bank transfer.",
  );

  sections = sections.filter((item) => item._key !== "4f075c61-f78");

  const applicationRows = section(sections, "74256235-083", "labelTable");
  const preferredClass = rowByKey(applicationRows.rows, "2f281199-849");
  if (preferredClass)
    preferredClass.value = i18n(
      "希望クラス（曜日・講師名）",
      "Preferred class (day of week and instructor)",
    );

  const notice = section(sections, "key99", "content");
  notice.body = blocksFromParagraphs(
    [
      "※駐車場はご用意しておりません。公共交通機関をご利用ください。",
      "※途中入学も可能です。空き状況をお問い合わせください。",
      "※クラス変更についてはご相談ください。",
      "※継続受講をお勧めしているため、既存の受講生申込は、一般より少し早目に受け付けています。",
      "※先着順にて申込を受け付けます。入金が確認できた時点で申込完了となります。",
    ],
    [
      "No parking is available; please use public transportation.",
      "Mid-term enrollment is possible; please ask about availability.",
      "Please consult us regarding class changes.",
      "Because we recommend continuing enrollment, applications from current students are accepted slightly earlier than general applications.",
      "Applications are accepted in order of arrival. Registration is complete once payment is confirmed.",
    ],
  );

  return withReason(
    {
      description: i18n(
        "外国人とのコミュニケーションの基礎となる「外国語講座」を開催しています。実践的な会話スキルを身につけながら、異文化交流も楽しめます。",
        "We offer foreign language courses that build a foundation for communication with people from other countries. Participants can develop practical conversation skills while enjoying intercultural exchange.",
      ),
      sections,
    },
    "foreign language description, period, PDF downloads, payment, registration, and notice updates",
  );
}

function updateGlobalUnderstanding(doc) {
  return withReason(
    {
      description: replaceI18nText(doc.description, {
        自治会学習センターへ: "生涯学習センターなどへ",
        "community centers": "lifelong learning centers and other venues",
      }),
    },
    "global understanding description venue wording",
  );
}

function updateEnglishGuide(doc) {
  const sections = structuredClone(doc.sections ?? []);
  const gallery = section(sections, "key154", "gallery");
  gallery.images = (gallery.images ?? []).filter(
    (image) => !["key156", "key157"].includes(image._key),
  );
  return withReason(
    {
      description: replaceI18nText(doc.description, {
        "ガイドツアーを年2回実施しています。": "ガイドツアーを実施しています。",
        "Twice a year, we run": "We run",
      }),
      sections,
    },
    "English guide description and removed mismatched Sarushima photos",
  );
}

function updateCooking(doc) {
  const sections = structuredClone(doc.sections ?? []);
  const guide = section(sections, "key169", "labelTable");
  const fee = rowByKey(guide.rows, "key170");
  if (fee) fee.value = replaceI18nText(fee.value, { 多少変動あり: "当日現金支払" });

  const gallery = section(sections, "key175", "gallery");
  setCaption(gallery, "key176", "2025年7月 香港料理", "July 2025 Hong Kong Cuisine");
  setCaption(gallery, "key177", "2025年9月 アメリカ料理", "September 2025 American Cuisine");

  const taste = section(sections, "key179", "table");
  const translations = {
    2017: "United States, United Kingdom, Bangladesh, Russia",
    2018: "Italy, Philippines, Peru, China",
    2019: "Bolivia, France, Thailand, Canada",
    2022: "Nepal, Korea, Taiwan, United States",
    2023: "China, France, Hawaii",
    2024: "Vietnam, Bangladesh",
    2025: "Nepal, Hong Kong, United States, France",
  };
  for (const row of taste.rows ?? []) {
    const year = getI18n(row.cells?.[0], "ja");
    if (translations[year]) row.cells[1] = i18n(getI18n(row.cells?.[1], "ja"), translations[year]);
  }

  return withReason({ sections }, "cooking fee note, captions, and cuisine English translations");
}

function updateCounseling(doc) {
  const sections = structuredClone(doc.sections ?? []);
  const schedule = section(sections, "key39", "table");
  schedule.rows = (schedule.rows ?? []).filter((row) => getI18n(row.cells?.[0], "ja") !== "火曜日");
  return withReason(
    {
      description: replaceI18nText(doc.description, {
        "相談は無料です（一部の専門的な相談は有料となる場合があります）。": "相談は無料です。",
        "Consultations are free (some specialized consultations may be charged).":
          "Consultations are free.",
      }),
      sections,
    },
    "counseling free-consultation wording and Tuesday row removal",
  );
}

function updateTranslation(doc) {
  const sections = structuredClone(doc.sections ?? []);
  const counter = section(sections, "counter-translation", "content");
  counter.body = replaceBlocksText(counter.body, { 行ないます: "行います" });
  const counterWarning = section(sections, "0d1bde80-98f", "warnings");
  replaceWarningText(counterWarning, { 受付られません: "受け付けられません" });

  const dispatch = section(sections, "interpretation-dispatch", "content");
  dispatch.title = i18n("翻訳・通訳", "Translation & Interpretation");
  dispatch.body = replaceBlocksText(dispatch.body, { 行ないます: "行います" });

  const dispatchRows = section(sections, "73a436e1-587", "labelTable");
  const method = rowByKey(dispatchRows.rows, "key69");
  if (method) {
    method.value = replaceI18nText(method.value, {
      "提出してください。※": "提出してください。\n※",
      "submit it to YIA at least two weeks in advance. Depending":
        "submit it to YIA at least two weeks in advance.\nDepending",
    });
  }
  const dispatchWarning = section(sections, "d9404b72-502", "warnings");
  replaceWarningText(dispatchWarning, { 受付られません: "受け付けられません" });

  return withReason(
    { sections },
    "translation wording, warning spelling, title, and note line break",
  );
}

function updateDisasterPrep(doc) {
  const sections = structuredClone(doc.sections ?? []);
  const links = section(sections, "key75", "links");
  const video = links.items?.find((item) => item._key === "key76");
  if (video)
    video.label = i18n(
      "外国人のための防災講座",
      "Disaster Preparedness Course for Foreign Residents",
    );
  return withReason(
    {
      title: i18n("外国人防災啓発事業", "Disaster Preparedness Program for Foreign Residents"),
      description: i18n(
        "外国籍市民を対象とした「外国人防災啓発事業」を実施しています。地震や災害時の行動、避難方法などを学ぶ実践的なプログラムです。",
        "We provide a disaster preparedness program for foreign residents. This practical program covers what to do during earthquakes and disasters, including evacuation methods.",
      ),
      sections,
    },
    "disaster-prep title, description, and video title",
  );
}

function updateFairtrade(doc) {
  const sections = structuredClone(doc.sections ?? []);
  const end = section(sections, "d6e03f85-ac1", "content");
  end.body = blocks(
    "横須賀国際交流協会事務局窓口、又はTEL,FAX,E-mailでお申し込みください。現金とお引き換えにお渡しします。",
    "Please apply at the YIA office counter or by telephone, fax, or email. Items are provided in exchange for cash payment.",
  );
  return withReason({ sections }, "fair trade coffee purchase instructions");
}

function updateSisterCity(doc) {
  const sections = structuredClone(doc.sections ?? []);
  const dispatchSchedule = section(sections, "1d65d433-a0e", "labelTable");
  dispatchSchedule.title = i18n("2026年度スケジュール", "2026 Schedule");
  dispatchSchedule.hideTitle = false;
  dispatchSchedule.rows = [
    row(
      "corpus-christi-2026",
      "コーパスクリスティ",
      "Corpus Christi",
      "7月19日〜8月3日",
      "July 19-August 3",
    ),
    row("fremantle-2026", "フリマントル", "Fremantle", "8月10日〜8月25日", "August 10-25"),
    row("medway-2026", "メッドウェイ", "Medway", "8月12日〜8月27日", "August 12-27"),
  ];

  const info = section(sections, "key203", "labelTable");
  info.title = i18n("募集説明会", "Information Session");
  const date = rowByKey(info.rows, "key204");
  if (date)
    date.value = i18n(
      "3月26日（木）16:00〜17:30（終了しました）",
      "Thursday, March 26, 16:00-17:30 (ended)",
    );

  const sisterCities = section(sections, "key206", "imageCards");
  const fremantle = (sisterCities.items ?? []).find(
    (item) => getI18n(item.name, "ja") === "フリマントル市",
  );
  if (fremantle) fremantle.note = i18n("", "");

  const downloads = section(sections, "key211", "links");
  const detail = downloads.items?.find((item) => item._key === "key212");
  if (detail) detail.label = i18n("説明会チラシ", "Information Session Flyer");

  return withReason(
    {
      description: i18n(
        "横須賀市の姉妹都市との交換学生プログラムです。毎年夏に高校生を派遣し、ホームステイをしながら現地の文化を体験します。また、姉妹都市からの学生をホストファミリーとして受け入れます。",
        "A student exchange program with Yokosuka's sister cities. Each summer, high school students travel abroad for homestays and local cultural experiences. YIA also welcomes students from sister cities through host families.",
      ),
      sections,
    },
    "sister city description, 2026 schedule, information session, Fremantle note, and flyer label",
  );
}

function updateAboutYia(doc) {
  const sections = structuredClone(doc.sections ?? []);
  const overview = section(sections, "key223", "labelTable");
  rowByKey(overview.rows, "key226").value = i18n(
    "個人会員374名（正会員、家族会員、準会員）、団体会員15、賛助会員14（法人）（令和8年4月1日現在）",
    "374 individual members (regular, family, and associate members), 15 organization members, 14 supporting corporate members (as of April 1, 2026)",
  );
  rowByKey(overview.rows, "key227").value = i18n(
    "職員4名（令和8年4月1日現在）",
    "4 staff members (as of April 1, 2026)",
  );

  const business = section(sections, "key228", "labelTable");
  business.rows = [
    row(
      "act-events",
      "イベント",
      "Events",
      "日本文化体験教室&ジャパンフェスティバル イン よこすか、キッズフェスティバル、国際ユースフォーラム",
      "Japanese Culture Experience Class & Japan Festival in Yokosuka, Kids Festival, International Youth Forum",
    ),
    row(
      "act-learning",
      "教室・講座",
      "Classes & Courses",
      "日本語会話サロン、外国語講座、国際理解講座、英語ガイドツアー、世界の料理教室",
      "Japanese Conversation Salon, Foreign Language Courses, Global Understanding Seminars, English Guide Tour, World Cooking Class",
    ),
    row(
      "act-support",
      "相談・サービス",
      "Consultation & Services",
      "多言語による生活相談、翻訳・通訳、外国人防災啓発事業",
      "Multilingual Counseling, Translation & Interpretation, Disaster Preparedness Program for Foreign Residents",
    ),
    row(
      "act-exchange",
      "交流・協力",
      "Exchange & Partnerships",
      "ホームステイ・ホームビジット、フェアトレードコーヒー、姉妹都市交換学生",
      "Homestay & Home Visit, Fair Trade Coffee, Sister City Exchange Students",
    ),
    row(
      "act-other",
      "その他",
      "Other",
      "情報誌発行、メールマガジン、ホームページ運営、ボランティア交流会",
      "Newsletter publishing, email newsletters, website operations, volunteer networking",
    ),
  ];

  const history = section(sections, "key234", "table");
  const historyText = {
    1995: "ジャパン フェスティバル インよこすか、日本語教授法講座開始",
    1996: "日本語会話サロン、スポーツ交流開始",
    1997: "任意団体横須賀国際交流協会発足（理事長　西原鈴子）。各種事業・情報紙「NEWSPOT」発行開始",
    1998: "ハロウィーン、日本文化体験教室など新事業開始",
    2001: "理事長交代（庄司信行）",
    2003: "NPO法人横須賀国際交流協会設立（理事長　多賀名和枝）。外国語講座、翻訳・通訳、国際貢献事業などが収益事業に。姉妹都市交換学生、日米親善ベース歴史ツアー受託開始",
    2007: "外国人防災啓発事業開始",
    2008: "設立10周年記念式典、理事長交代　藤井長生、世界の料理教室開始",
    2012: "横須賀商工会議所パートナーシップ事業開始",
    2013: "理事長交代　安東崇夫、横須賀市指定NPO法人となる",
    2014: "神奈川県認定NPO法人となる",
    2015: "上町商店街出前英会話講座、英語ガイドツアー開始",
    2018: "幼児対象英語クラス開始",
    2022: "文化交流事業を自主運営化",
  };
  for (const item of history.rows ?? []) {
    const year = getI18n(item.cells?.[0], "ja");
    if (historyText[year]) item.cells[1] = i18n(historyText[year], getI18n(item.cells?.[1], "en"));
  }

  const operations = section(sections, "key262", "infoCards");
  setInfo(
    operations,
    "key265",
    "運営委員会",
    "理事と事業執行部門の代表で構成し、協会運営に関する事項をまとめる。",
  );
  setInfo(
    operations,
    "key266",
    "事業執行委員会",
    "各事業の企画・運営を担当するボランティア委員会。",
  );
  setInfo(operations, "key268", "事務局", "日常業務の運営、会員管理等を担当。");

  return withReason(
    { sections },
    "about YIA overview, business content, history, and operations wording",
  );
}

function updateMembership(doc) {
  const sections = structuredClone(doc.sections ?? []);
  const benefits = section(sections, "key281", "content");
  benefits.body = replaceBlocksText(benefits.body, {
    ボランティア保険適応対象: "ボランティア保険適用対象",
  });
  return withReason({ sections }, "membership insurance wording");
}

function updateDisasterVolunteerAnnouncement(doc) {
  return withReason(
    {
      title: i18n(
        "災害時通訳翻訳ボランティア募集",
        "Disaster Interpretation and Translation Volunteers Wanted",
      ),
    },
    "disaster volunteer announcement title",
  );
}

function withReason(set, reason) {
  Object.defineProperty(set, "__reason", { value: reason, enumerable: false });
  return set;
}

function ref(id, key = id) {
  return { _key: key, _type: "reference", _ref: id };
}

function section(sections, key, type, { required = true } = {}) {
  const found = sections.find((item) => item._key === key);
  if (!found && required) {
    throw fail("Missing expected section while applying launch feedback.", {
      fix: "Refresh the script targets against the current Sanity document.",
      context: { key, type },
    });
  }
  if (found && type && found._type !== type) {
    throw fail("Section type mismatch while applying launch feedback.", {
      fix: "Refresh the script targets against the current Sanity document.",
      context: { key, expected: type, actual: found._type },
    });
  }
  return found;
}

function rowByKey(rows, key) {
  return (rows ?? []).find((item) => item._key === key);
}

function row(key, labelJa, labelEn, valueJa, valueEn = "") {
  return { _key: key, label: i18n(labelJa, labelEn), value: i18n(valueJa, valueEn) };
}

function upsertRow(rows, key, labelJa, labelEn, valueJa, valueEn = "") {
  const existing = rowByKey(rows, key);
  if (existing) {
    existing.label = i18n(labelJa, labelEn);
    existing.value = i18n(valueJa, valueEn);
    return;
  }
  rows.push(row(key, labelJa, labelEn, valueJa, valueEn));
}

function upsertLink(items, key, labelJa, labelEn, assetRef, filename) {
  const existing = (items ?? []).find((item) => item._key === key);
  const next = {
    _key: key,
    type: "document",
    fileType: "PDF",
    label: i18n(labelJa, labelEn),
    file: { _type: "file", asset: { _type: "reference", _ref: assetRef } },
  };
  if (filename) next.filename = filename;
  if (existing) Object.assign(existing, next);
  else items.push(next);
}

function setCell(row, index, jaValue, enValue = "") {
  while ((row.cells ??= []).length <= index) row.cells.push(i18n("", ""));
  row.cells[index] = i18n(jaValue, enValue);
}

function ensureFirstColumn(table, key, labelJa, labelEn, values) {
  if (table.columns?.[0]?._key === key) return;
  table.columns = [
    { _key: key, label: i18n(labelJa, labelEn), type: "text" },
    ...(table.columns ?? []),
  ];
  for (const [index, row] of (table.rows ?? []).entries()) {
    row.cells = [i18n(values[index]?.[0] ?? "", values[index]?.[1] ?? ""), ...(row.cells ?? [])];
  }
}

function setCaption(gallery, key, jaValue, enValue = "") {
  const image = gallery.images?.find((item) => item._key === key);
  if (image) image.caption = i18n(jaValue, enValue);
}

function upsertSectionAfter(sections, afterKey, nextSection) {
  const existingIndex = sections.findIndex((item) => item._key === nextSection._key);
  if (existingIndex >= 0) {
    sections[existingIndex] = nextSection;
    return;
  }
  const afterIndex = sections.findIndex((item) => item._key === afterKey);
  sections.splice(afterIndex >= 0 ? afterIndex + 1 : sections.length, 0, nextSection);
}

function getI18n(field, key) {
  return field?.find((item) => item._key === key)?.value ?? "";
}

function replaceI18nText(field, replacements) {
  return (field ?? []).map((entry) => ({
    ...entry,
    value:
      typeof entry.value === "string"
        ? replaceText(entry.value, replacements)
        : replaceBlocks(entry.value, replacements),
  }));
}

function replaceBlocksText(field, replacements) {
  return (field ?? []).map((entry) => ({
    ...entry,
    value: replaceBlocks(entry.value, replacements),
  }));
}

function replaceBlocks(blocksValue, replacements) {
  return (blocksValue ?? []).map((block) => ({
    ...block,
    children: (block.children ?? []).map((child) => ({
      ...child,
      text: typeof child.text === "string" ? replaceText(child.text, replacements) : child.text,
    })),
  }));
}

function replaceWarningText(sectionValue, replacements) {
  for (const item of sectionValue.items ?? [])
    item.value = replaceI18nText(item.value, replacements);
}

function replaceText(value, replacements) {
  let next = value;
  for (const [from, to] of Object.entries(replacements)) next = next.split(from).join(to);
  return next;
}

function blocks(jaValue, enValue = "") {
  return [
    { _key: "ja", value: textBlocks([jaValue], "ja") },
    { _key: "en", value: textBlocks([enValue], "en") },
  ];
}

function blocksFromParagraphs(jaParagraphs, enParagraphs) {
  return [
    { _key: "ja", value: textBlocks(jaParagraphs, "ja") },
    { _key: "en", value: textBlocks(enParagraphs, "en") },
  ];
}

function textBlocks(paragraphs, lang) {
  return paragraphs
    .filter((text) => text !== undefined && text !== null)
    .map((text, index) => ({
      _key: `${lang}-${index + 1}`,
      _type: "block",
      children: [
        {
          _key: `${lang}-${index + 1}-span`,
          _type: "span",
          marks: [],
          text,
        },
      ],
      markDefs: [],
      style: "normal",
    }));
}

function setInfo(sectionValue, key, termJa, definitionJa) {
  const item = (sectionValue.items ?? []).find((entry) => entry._key === key);
  if (!item) return;
  item.term = i18n(termJa, getI18n(item.term, "en"));
  item.definition = i18n(definitionJa, getI18n(item.definition, "en"));
}
