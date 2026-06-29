#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fail, i18n, logSummary, patchWithRevision, runSanityScript } from "./lib/sanity-tools.mjs";

const SCREENSHOT_DIR = "/private/tmp/yia-renewal-screenshots";
const ANNOUNCEMENT_IDS = [
  "announcement-website-renewal-2026",
  "drafts.announcement-website-renewal-2026",
];

const SHOTS = [
  {
    key: "home-old",
    filename: "renewal-home-old.png",
    captionJa: "リニューアル前：旧トップページ。左側メニューとテキスト中心の案内でした。",
    captionEn: "Before: the old homepage, built around a left-side menu and text-heavy links.",
  },
  {
    key: "home-new",
    filename: "renewal-home-new.png",
    captionJa: "リニューアル後：新トップページ。大きな写真、整理されたナビゲーション、お知らせを見やすく配置しました。",
    captionEn:
      "After: the new homepage, with a large photo, clearer navigation, and easier-to-scan announcements.",
  },
  {
    key: "conversation-old",
    filename: "renewal-conversation-old.png",
    captionJa: "リニューアル前：日本語会話サロン。予定表や地図へのリンク、クラス一覧が表の中にまとまっていました。",
    captionEn:
      "Before: Japanese Conversation Classes, where schedules, maps, and class information were packed into a table layout.",
  },
  {
    key: "conversation-new",
    filename: "renewal-conversation-new.png",
    captionJa: "リニューアル後：日本語会話サロン。申込書・予定表・地図、会場別クラス、こども向けクラスを分けて探しやすくしました。",
    captionEn:
      "After: Japanese Conversation Classes, split into application links, venue-based adult classes, and children/student classes.",
  },
  {
    key: "sister-old",
    filename: "renewal-sister-old.png",
    captionJa: "リニューアル前：姉妹都市交換学生。派遣・受入・姉妹都市情報が長いページ内に続いていました。",
    captionEn:
      "Before: Sister City Exchange Students, with dispatch, hosting, and city information continuing through one long page.",
  },
  {
    key: "sister-new",
    filename: "renewal-sister-new.png",
    captionJa: "リニューアル後：姉妹都市交換学生。スケジュール、写真、募集説明会、姉妹都市カードを見出しごとに整理しました。",
    captionEn:
      "After: Sister City Exchange Students, organized into schedule, photos, information session, and sister city cards.",
  },
  {
    key: "about-old",
    filename: "renewal-about-old.png",
    captionJa: "リニューアル前：YIAについて。概要と沿革が文章・表で掲載されていました。",
    captionEn:
      "Before: About YIA, where the overview and history were presented in older text/table formatting.",
  },
  {
    key: "about-new",
    filename: "renewal-about-new.png",
    captionJa: "リニューアル後：YIAについて。団体概要、事業内容、あゆみ、役員一覧を読みやすいセクションに分けました。",
    captionEn:
      "After: About YIA, with organization overview, activities, history, and board members separated into clearer sections.",
  },
];

await runSanityScript({
  name: "Rewrite website renewal announcement",
  description: "Adds detailed before/after screenshots and rewrite copy to the renewal announcement.",
  async handler({ client, dryRun }) {
    const assets = {};
    for (const shot of SHOTS) {
      assets[shot.key] = await getOrUploadImage(client, screenshotPath(shot.key), {
        dryRun,
        filename: shot.filename,
      });
    }

    const docs = await client.fetch(`*[_id in $ids]{_id,_rev,body,excerpt,heroImage}`, {
      ids: ANNOUNCEMENT_IDS,
    });
    if (!docs?.length) {
      throw fail("Website renewal announcement was not found.", {
        fix: "Confirm the announcement id before rerunning.",
        context: { ids: ANNOUNCEMENT_IDS },
      });
    }

    const set = {
      heroImage: imageRef(assets["home-new"]._id),
      excerpt: i18n(
        "旧サイトと新サイトの画面を比べながら、トップページ、各活動ページ、姉妹都市交換学生、YIAについての見せ方がどのように変わったかをご紹介します。",
        "A visual look at how the redesigned site changed the homepage, activity pages, Sister City Exchange Students, and About YIA sections.",
      ),
      body: buildBody(assets),
    };

    let patched = 0;
    let skippedUnchanged = 0;
    const results = [];
    for (const doc of docs) {
      const changed = stableStringify(pickPatchSource(doc, set)) !== stableStringify(set);
      if (!changed) {
        skippedUnchanged += 1;
        results.push({ docId: doc._id, changed: false });
        continue;
      }

      await patchWithRevision(client, doc, set, { dryRun });
      patched += 1;
      results.push({ docId: doc._id, changed: true });
    }

    logSummary({
      dryRun,
      screenshots: SHOTS.length,
      found: docs.length,
      patched,
      skippedUnchanged,
      results,
    });
  },
});

function buildBody(assets) {
  return [
    {
      _key: "ja",
      value: [
        block(
          "ja-intro-1",
          "横須賀国際交流協会のホームページをリニューアルしました。今回の更新では、見た目を新しくするだけでなく、利用者が必要な情報へ早くたどり着けることを大切にしました。",
        ),
        block(
          "ja-intro-2",
          "旧サイトと新サイトの画面を比べながら、主な変更点をご紹介します。",
        ),
        heading("ja-home-heading", "トップページ：活動への入口をわかりやすく"),
        gallery("ja-home-gallery", [shotItem("home-old", assets), shotItem("home-new", assets)]),
        block(
          "ja-home-body",
          "旧トップページは多くのリンクが縦に並び、目的の活動を探すには文字を追う必要がありました。新トップページでは、YIAの雰囲気が伝わる大きな写真、主要カテゴリへのナビゲーション、最新のお知らせを上部に配置し、初めて訪れる方にも全体像が伝わりやすい構成にしています。",
        ),
        heading("ja-conversation-heading", "日本語会話サロン：申込・予定表・クラス情報を整理"),
        gallery("ja-conversation-gallery", [
          shotItem("conversation-old", assets),
          shotItem("conversation-new", assets),
        ]),
        block(
          "ja-conversation-body",
          "日本語会話サロンでは、申込書、予定表、地図、クラス一覧が同じ画面内に混在していました。新サイトでは「申込書・予定表・地図」を先に置き、大人向けクラス、その他の場所のクラス、こども・学生向けクラスを分けて掲載しています。参加したい人が、自分に合うクラスと必要資料を見つけやすくなりました。",
        ),
        heading("ja-sister-heading", "姉妹都市交換学生：事業内容と募集情報を分かりやすく"),
        gallery("ja-sister-gallery", [
          shotItem("sister-old", assets),
          shotItem("sister-new", assets),
        ]),
        block(
          "ja-sister-body",
          "姉妹都市交換学生のページは、派遣事業、受入事業、募集説明会、姉妹都市紹介を見出しごとに整理しました。日程や資料を確認する人、姉妹都市について知りたい人、ホストファミリーに関心がある人が、それぞれ必要な場所へ進みやすくなっています。",
        ),
        heading("ja-about-heading", "YIAについて：団体概要とあゆみを読みやすく"),
        gallery("ja-about-gallery", [shotItem("about-old", assets), shotItem("about-new", assets)]),
        block(
          "ja-about-body",
          "YIAについてのページでは、団体概要、事業内容、あゆみ、役員一覧を独立したセクションに分けました。協会の成り立ちや現在の活動を、表や見出しを通じて確認しやすくしています。",
        ),
        block(
          "ja-close",
          "今後も、活動内容やお知らせを分かりやすく発信できるよう、情報を更新していきます。ご意見・ご感想がございましたら、事務局までお寄せください。",
        ),
      ],
    },
    {
      _key: "en",
      value: [
        block(
          "en-intro-1",
          "The Yokosuka International Association website has been redesigned. This update is not only a visual refresh: it is meant to help visitors find the information they need more quickly.",
        ),
        block(
          "en-intro-2",
          "Here is a before-and-after look at several areas of the site and what changed.",
        ),
        heading("en-home-heading", "Homepage: clearer entry points into YIA activities"),
        gallery("en-home-gallery", [shotItem("home-old", assets), shotItem("home-new", assets)]),
        block(
          "en-home-body",
          "The old homepage placed many text links in a vertical layout, so visitors had to scan carefully to find the right activity. The new homepage introduces YIA with a large activity photo, clearer category navigation, and an announcements area near the top, making the overall structure easier to understand at a glance.",
        ),
        heading("en-conversation-heading", "Japanese Conversation Classes: applications, schedules, and classes separated"),
        gallery("en-conversation-gallery", [
          shotItem("conversation-old", assets),
          shotItem("conversation-new", assets),
        ]),
        block(
          "en-conversation-body",
          "The Japanese Conversation Classes page used to combine application links, schedules, maps, and class lists in one dense table-style page. The redesigned page first shows application, schedule, and map links, then separates adult classes, other-location classes, and children/student classes so visitors can find the right class more easily.",
        ),
        heading("en-sister-heading", "Sister City Exchange Students: program details and recruitment information"),
        gallery("en-sister-gallery", [
          shotItem("sister-old", assets),
          shotItem("sister-new", assets),
        ]),
        block(
          "en-sister-body",
          "The Sister City Exchange Students page is now organized by section: dispatch program, host family program, information session, downloads, and sister city cards. This makes it easier for applicants, host families, and visitors interested in the sister cities to move directly to the information they need.",
        ),
        heading("en-about-heading", "About YIA: overview and history made easier to read"),
        gallery("en-about-gallery", [shotItem("about-old", assets), shotItem("about-new", assets)]),
        block(
          "en-about-body",
          "The About YIA page now separates the organization overview, activities, history, and board member information into clear sections. The association’s background and current work can be reviewed more comfortably through headings and structured tables.",
        ),
        block(
          "en-close",
          "We will continue updating the website so that YIA activities and announcements are easier to follow. If you have comments or feedback, please contact the YIA office.",
        ),
      ],
    },
  ];
}

function screenshotPath(key) {
  return path.join(SCREENSHOT_DIR, `${key}.png`);
}

async function getOrUploadImage(client, filePath, { dryRun, filename }) {
  if (!fs.existsSync(filePath)) {
    throw fail("Screenshot file was not found.", {
      fix: "Run scripts/capture-renewal-screenshots.mjs before rewriting the announcement.",
      context: { filePath },
    });
  }

  const stat = fs.statSync(filePath);
  const sha1 = crypto.createHash("sha1").update(fs.readFileSync(filePath)).digest("hex");
  const existing = await client.fetch(
    `*[_type == "sanity.imageAsset" && originalFilename == $filename]{
      _id,
      originalFilename,
      size,
      sha1hash,
      url
    }`,
    { filename },
  );
  const deterministic = (existing ?? []).filter(
    (asset) => asset.sha1hash === sha1 || asset.size === stat.size,
  );

  if (deterministic.length === 1) {
    console.log(`Using existing image asset: ${deterministic[0]._id}`);
    return deterministic[0];
  }

  if ((existing ?? []).length > 0 && deterministic.length !== 1) {
    throw fail("Ambiguous Sanity image asset match.", {
      fix: "Use a unique screenshot filename or remove stale duplicate assets before reusing by filename.",
      context: {
        filename,
        localSize: stat.size,
        localSha1: sha1,
        matches: existing.map((asset) => ({
          _id: asset._id,
          size: asset.size,
          sha1hash: asset.sha1hash,
        })),
      },
    });
  }

  if (dryRun) {
    console.log(`[dry-run] Would upload image asset: ${filename}`);
    return { _id: `image-${sha1}-1440x1100-png`, dryRun: true };
  }

  return client.assets.upload("image", fs.createReadStream(filePath), {
    filename,
    contentType: "image/png",
  });
}

function block(key, text) {
  return {
    _key: key,
    _type: "block",
    style: "normal",
    markDefs: [],
    children: [{ _key: `${key}-span`, _type: "span", text, marks: [] }],
  };
}

function heading(key, text) {
  return {
    ...block(key, text),
    style: "h2",
  };
}

function gallery(key, images) {
  return {
    _key: key,
    _type: "inlineGallery",
    images,
  };
}

function shotItem(key, assets) {
  const shot = SHOTS.find((item) => item.key === key);
  if (!shot) throw new Error(`Unknown shot key: ${key}`);

  return {
    _key: `${key}-image`,
    _type: "imageFile",
    file: imageRef(assets[key]._id),
    caption: i18n(shot.captionJa, shot.captionEn),
  };
}

function imageRef(assetId) {
  return {
    _type: "image",
    asset: { _type: "reference", _ref: assetId },
  };
}

function pickPatchSource(doc, set) {
  return Object.fromEntries(Object.keys(set).map((key) => [key, doc[key]]));
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
      .map((key) => [key, sortKeys(value[key])]),
  );
}
