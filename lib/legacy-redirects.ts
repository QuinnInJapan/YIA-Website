export interface SiteRedirect {
  source: string;
  destination: string;
  permanent: true;
}

function permanent(source: string, destination: string): SiteRedirect {
  return { source, destination, permanent: true };
}

/**
 * HTML pages captured from the public yia.jp site on 2026-06-18.
 * Keep these explicit: the old site used inconsistent folders, extensions, and spellings.
 */
export const legacyPageRedirects: SiteRedirect[] = [
  permanent("/index.htm", "/"),
  permanent("/top/09aboutyia/aboutyia-top.htm", "/about/about"),
  permanent("/top/09aboutyia/ennkaku/aboutyia-top.htm", "/about/about"),
  permanent("/top/09aboutyia/kaiinn/kaiinn-top.htm", "/about/membership"),
  permanent("/top/09aboutyia/sanjo/sanjyokaiin-top.htm", "/about/supporting-membership"),
  permanent(
    "/top/09katsudo/shien/kaiwasalon/kaiwasalon-top/kaiwasalon-top.html",
    "/classes/conversation-salon",
  ),
  permanent(
    "/top/09katsudo/shien/seikatsusodan/sekatsusodan-top/seikatsusodan-top.html",
    "/services/counseling",
  ),
  permanent("/top/09katsudo/shien/honyaku/honyaku-top/honyaku-top.html", "/services/translation"),
  permanent("/top/09katsudo/shien/bosai/bosai-top/bosai-top.html", "/services/disaster-prep"),
  permanent(
    "/top/09katsudo/kehatsu/gaikokugo/gaikokugo-top/gaikokugo-top.htm",
    "/classes/foreign-languages",
  ),
  permanent(
    "/top/09katsudo/kehatsu/kokusairikai/kokusairikai-top/kokusairikai-top.html",
    "/classes/global-understanding",
  ),
  permanent("/top/09katsudo/kehatsu/youthfo/youthfo-top/youthfo-top.html", "/events/youth-forum"),
  permanent(
    "/top/09katsudo/kouryu/nihonbunka/nihonbunka-top/nihonbunka-top.htm",
    "/events/japan-festival",
  ),
  permanent("/top/09katsudo/kouryu/kids/kids-top/kids-top.htm", "/events/kids"),
  permanent(
    "/top/09katsudo/kouryu/homestay/homestay-top/englishguide-top.htm",
    "/classes/guide-training",
  ),
  permanent(
    "/top/09katsudo/kouryu/homestay/homestay-top/homestay-top.htm",
    "/partnerships/homestay",
  ),
  permanent("/top/09katsudo/kouryu/cooking/cooking-top/cooking-top.htm", "/classes/cooking"),
  permanent(
    "/top/09katsudo/kokusaikoken/kokusaikoken-top/kokusaikoken-top.htm",
    "/partnerships/global-contribution",
  ),
  permanent(
    "/top/09katsudo/sistercity/sistercity-top/sistercity-top.htm",
    "/partnerships/sister-city",
  ),
];

const conversationSalonFiles = [
  "2014application.doc",
  "2026kaiwasaron.pdf",
  "2026map.pdf",
  "2026irohakai.pdf",
  "2026nihongoclub.pdf",
  "tanoshii2024.pdf",
  "photos.pdf",
  "2026ybridge.pdf",
  "2025terakoyasan.pdf",
  "wakaba2025.pdf",
  "2023crossroads.pdf",
  "2025sakurakai.pdf",
  "2024nihongoplaza.pdf",
];

const foreignLanguageFiles = [
  "2026language1.pdf",
  "2026chinese1.pdf",
  "2026travel1.pdf",
  "2026talk1.pdf",
  "2026night1.pdf",
];

/** Old files now maintained through their corresponding Studio-managed page. */
export const legacyDocumentRedirects: SiteRedirect[] = [
  permanent(
    "/teikan.pdf",
    "https://cdn.sanity.io/files/tarzpcp3/production/fa468c64b43168c2dbf41cc60db75a08b56b80e7.pdf",
  ),
  permanent(
    "/2026yakuin.pdf",
    "https://cdn.sanity.io/files/tarzpcp3/production/a5d8c5782531136d459f43390b2f22b17b6d6a31.pdf",
  ),
  permanent(
    "/20261go.pdf",
    "https://cdn.sanity.io/files/tarzpcp3/production/081d1d2b1d0bfac45675669459bca6dc3dc31023.pdf",
  ),
  permanent(
    "/20262go.pdf",
    "https://cdn.sanity.io/files/tarzpcp3/production/0bf072f8146952ec1d7fa27bb08e8651b068b0fe.pdf",
  ),
  permanent(
    "/2026taishakutaisho.pdf",
    "https://cdn.sanity.io/files/tarzpcp3/production/7aa6d16c854234faecdb6a44b3fb3614bb59fad6.pdf",
  ),
  permanent(
    "/20263go.pdf",
    "https://cdn.sanity.io/files/tarzpcp3/production/0cdb2963fb7ef5d3bc72f20487816f773f188fb5.pdf",
  ),
  permanent(
    "/20264go.pdf",
    "https://cdn.sanity.io/files/tarzpcp3/production/4863fb8864698f15624f49a3cbde3c0f3be77814.pdf",
  ),
  ...foreignLanguageFiles.map((file) => permanent(`/${file}`, "/classes/foreign-languages")),
  permanent("/katsudoiraisho2.xls", "/services/translation"),
  permanent("/top/09aboutyia/kaiinn/kaiin.xls", "/about/membership"),
  permanent("/top/09aboutyia/kaiinn/danntai201610.xls", "/about/membership"),
  permanent("/top/09aboutyia/kaiinn/2024sanjo.xls", "/about/membership"),
  permanent("/top/09aboutyia/kaiinn/gakusei201610.xls", "/about/membership"),
  permanent("/top/09aboutyia/kaiinn/gaikokujinn201610nihonngo.xls", "/about/membership"),
  permanent("/top/09aboutyia/kaiinn/jyunkaiineigo.xls", "/about/membership"),
  ...conversationSalonFiles.map((file) =>
    permanent(
      `/top/09katsudo/shien/kaiwasalon/kaiwasalon-top/${file}`,
      "/classes/conversation-salon",
    ),
  ),
  permanent(
    "/top/09katsudo/shien/seikatsusodan/sekatsusodan-top/Chirashi2025.pdf",
    "/services/counseling",
  ),
  permanent("/top/09katsudo/shien/honyaku/honyaku-top/katsudoiraisho.pdf", "/services/translation"),
  ...foreignLanguageFiles.map((file) =>
    permanent(
      `/top/09katsudo/kehatsu/gaikokugo/gaikokugo-top/${file}`,
      "/classes/foreign-languages",
    ),
  ),
];

/** Obvious destinations for links that were already broken when the old site was captured. */
export const historicalBrokenLinkRedirects: SiteRedirect[] = [
  permanent("/top/09katsudonaiyo/koryu/koryu-top/koryu-top.htm", "/events"),
  permanent(
    "/top/09katsudonaiyo/kokusaikoken/kokusaikoken-top/kokusaikoken-top.htm",
    "/partnerships",
  ),
  permanent(
    "/top/09katsudonaiyo/sistercity/sistercity-top/sistercity-top.htm",
    "/partnerships/sister-city",
  ),
  permanent("/top/09katsudonaiyo/shien/shien-top/shien-top.htm", "/services"),
  permanent("/top/09katsudonaiyo/keihatsu/keihatsu-top/keihatsu-top.htm", "/classes"),
  permanent(
    "/top/09katsudo/kehatsu/kokusairikai/kokusairikai-hokoku/21kokusairikai-hokoku.htm",
    "/classes/global-understanding",
  ),
  permanent("/09japa-top.htm", "/"),
  permanent("/nihongo2014.pdf", "/classes/japanese-handbook"),
  permanent("/top/09aboutyia/kaiinn/kaiintouroku%20eigo2.xls", "/about/membership"),
  permanent("/top/09aboutyia/kaiinn/jyunkaiin%20nihongo.xls", "/about/membership"),
];

export const siteRedirects: SiteRedirect[] = [
  ...legacyPageRedirects,
  ...legacyDocumentRedirects,
  ...historicalBrokenLinkRedirects,
];
