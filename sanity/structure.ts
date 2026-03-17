import type { StructureBuilder } from "sanity/structure";
import {
  CogIcon,
  MenuIcon,
  ComponentIcon,
  UsersIcon,
  HeartIcon,
  BookIcon,
  CalendarIcon,
  EarthGlobeIcon,
} from "@sanity/icons";

// Singleton helper: opens directly to the document editor
function singleton(S: StructureBuilder, id: string, title: string, icon?: React.ComponentType) {
  const item = S.listItem().id(id).title(title);
  if (icon) item.icon(icon);
  return item.child(S.document().schemaType(id).documentId(id));
}

// Category group helper: filters pages by categoryRef reference
function categoryGroup(S: StructureBuilder, id: string, title: string, icon?: React.ComponentType) {
  const item = S.listItem().id(id).title(title);
  if (icon) item.icon(icon);
  return item.child(
    S.documentList()
      .id(id)
      .title(title)
      .schemaType("page")
      .apiVersion("2024-01-01")
      .filter('_type == "page" && categoryRef._ref == $catRef')
      .params({ catRef: `category-${id}` }),
  );
}

export function structure(S: StructureBuilder) {
  return S.list()
    .id("content")
    .title("コンテンツ")
    .items([
      // Page categories
      categoryGroup(S, "services", "相談・サービス", HeartIcon),
      categoryGroup(S, "classes", "教室・講座", BookIcon),
      categoryGroup(S, "events", "イベント", CalendarIcon),
      categoryGroup(S, "partnerships", "交流・協力", EarthGlobeIcon),
      S.listItem()
        .id("organization")
        .title("協会について")
        .icon(UsersIcon)
        .child(
          S.documentList()
            .id("organization")
            .title("協会について")
            .schemaType("page")
            .apiVersion("2024-01-01")
            .filter('_type == "page" && categoryRef._ref == "category-about"'),
        ),

      S.divider(),

      // Admin settings group
      S.listItem()
        .id("admin")
        .title("管理者設定")
        .icon(CogIcon)
        .child(
          S.list()
            .id("admin")
            .title("管理者設定")
            .items([
              singleton(S, "siteSettings", "サイト設定", CogIcon),
              singleton(S, "navigation", "ナビゲーション", MenuIcon),
              singleton(S, "sidebar", "サイドバー・フッター", ComponentIcon),
            ]),
        ),
    ]);
}
