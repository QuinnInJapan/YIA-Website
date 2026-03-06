import type { StructureBuilder } from "sanity/structure";
import {
  CogIcon,
  BellIcon,
  HomeIcon,
  MenuIcon,
  ComponentIcon,
  UsersIcon,
  HeartIcon,
  BookIcon,
  EarthGlobeIcon,
  TransferIcon,
} from "@sanity/icons";

// Singleton helper: opens directly to the document editor
function singleton(
  S: StructureBuilder,
  id: string,
  title: string,
  icon?: React.ComponentType,
) {
  const item = S.listItem().id(id).title(title);
  if (icon) item.icon(icon);
  return item.child(S.document().schemaType(id).documentId(id));
}

// Category group helper: filters pages by categoryRef reference
function categoryGroup(
  S: StructureBuilder,
  id: string,
  title: string,
  icon?: React.ComponentType,
) {
  const item = S.listItem().id(id).title(title);
  if (icon) item.icon(icon);
  return item.child(
    S.documentList()
      .id(id)
      .title(title)
      .schemaType("page")
      .filter('_type == "page" && categoryRef._ref == $catRef')
      .params({ catRef: `category-${id}` }),
  );
}

export function structure(S: StructureBuilder) {
  return S.list()
    .id("content")
    .title("Content")
    .items([
      // Site Settings
      S.listItem()
        .id("settings")
        .title("サイト設定 Site Settings")
        .icon(CogIcon)
        .child(
          S.list()
            .id("settings")
            .title("サイト設定 Site Settings")
            .items([
              singleton(S, "siteSettings", "サイト設定", CogIcon),
              singleton(S, "homepage", "ホームページ", HomeIcon),
              singleton(S, "navigation", "ナビゲーション", MenuIcon),
              singleton(S, "sidebar", "サイドバー・フッター", ComponentIcon),
            ]),
        ),

      S.divider(),

      // Announcements
      S.listItem()
        .id("announcements")
        .title("お知らせ Announcements")
        .icon(BellIcon)
        .child(
          S.documentList()
            .id("announcements")
            .title("お知らせ Announcements")
            .schemaType("announcement")
            .filter('_type == "announcement"')
            .defaultOrdering([{ field: "date", direction: "desc" }]),
        ),

      S.divider(),

      // Program categories — hardcoded here because Sanity structure API
      // doesn't support async data fetching. The site derives these from navigation data.
      categoryGroup(S, "support", "生活サポート Living Support", HeartIcon),
      categoryGroup(S, "learning", "語学・講座 Language & Classes", BookIcon),
      categoryGroup(S, "events", "イベント Events", TransferIcon),
      categoryGroup(S, "exchange", "国際交流 Global Exchange", EarthGlobeIcon),

      S.divider(),

      // Organization pages
      S.listItem()
        .id("organization")
        .title("協会について Organization")
        .icon(UsersIcon)
        .child(
          S.documentList()
            .id("organization")
            .title("協会について Organization")
            .schemaType("page")
            .filter('_type == "page" && !defined(categoryRef)'),
        ),
    ]);
}
