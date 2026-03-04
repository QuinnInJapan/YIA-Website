import type { StructureBuilder } from "sanity/structure";

// Singleton helper: opens directly to the document editor
function singleton(S: StructureBuilder, id: string, title: string) {
  return S.listItem()
    .id(id)
    .title(title)
    .child(S.document().schemaType(id).documentId(id));
}

// Category group helper: filters pages by category value
function categoryGroup(
  S: StructureBuilder,
  id: string,
  title: string,
) {
  return S.listItem()
    .id(id)
    .title(title)
    .child(
      S.documentList()
        .id(id)
        .title(title)
        .schemaType("page")
        .filter('_type == "page" && category == $cat')
        .params({ cat: id }),
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
        .child(
          S.list()
            .id("settings")
            .title("サイト設定 Site Settings")
            .items([
              singleton(S, "siteSettings", "サイト設定"),
              singleton(S, "homepage", "ホームページ"),
              singleton(S, "navigation", "ナビゲーション"),
              singleton(S, "globalResources", "グローバルリソース"),
            ]),
        ),

      S.divider(),

      // Announcements
      S.listItem()
        .id("announcements")
        .title("お知らせ Announcements")
        .child(
          S.documentList()
            .id("announcements")
            .title("お知らせ Announcements")
            .schemaType("announcement")
            .filter('_type == "announcement"'),
        ),

      S.divider(),

      // Program categories
      categoryGroup(S, "shien", "支援事業 Support Services"),
      categoryGroup(S, "kehatsu", "啓発事業 Educational Programs"),
      categoryGroup(S, "kouryu", "交流事業 Cultural Exchange"),
      categoryGroup(S, "kokusaikoken", "国際貢献 International Contribution"),

      S.divider(),

      // Organization pages
      S.listItem()
        .id("organization")
        .title("協会について Organization")
        .child(
          S.documentList()
            .id("organization")
            .title("協会について Organization")
            .schemaType("page")
            .filter('_type == "page" && !defined(category)'),
        ),
    ]);
}
