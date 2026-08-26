import { defineType, defineField } from "sanity";
import { BellIcon } from "@sanity/icons";
import {
  ANNOUNCEMENT_DESTINATION_DETAIL,
  ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE,
  announcementDestination,
  announcementSlugError,
} from "../../lib/announcement-fields";

export default defineType({
  name: "announcement",
  title: "お知らせ",
  type: "document",
  icon: BellIcon,
  orderings: [
    {
      title: "掲載日（新しい順）",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
    {
      title: "掲載日（古い順）",
      name: "dateAsc",
      by: [{ field: "date", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", date: "date", pinned: "pinned" },
    prepare: ({
      title,
      date,
      pinned,
    }: {
      title?: { _key: string; value: string }[];
      date?: string;
      pinned?: boolean;
    }) => ({
      title: `${pinned ? "📌 " : ""}${title?.find((t) => t._key === "ja")?.value || "Untitled"}`,
      subtitle: date || "",
    }),
  },
  fields: [
    defineField({
      name: "title",
      title: "タイトル",
      type: "internationalizedArrayString",
      validation: (Rule) => Rule.required().error("タイトルは必須です"),
    }),
    defineField({
      name: "destinationType",
      title: "リンク先",
      type: "string",
      initialValue: ANNOUNCEMENT_DESTINATION_DETAIL,
      options: {
        layout: "radio",
        list: [
          { title: "お知らせの詳細ページを作る", value: ANNOUNCEMENT_DESTINATION_DETAIL },
          {
            title: "サイト内の既存ページへ案内する",
            value: ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE,
          },
        ],
      },
      description: "未設定の既存のお知らせは詳細ページとして扱われます。",
    }),
    defineField({
      name: "targetPage",
      title: "リンク先ページ",
      type: "reference",
      to: [{ type: "page" }],
      hidden: ({ document }) =>
        announcementDestination(document?.destinationType) !==
        ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (
            announcementDestination(context.document?.destinationType) !==
            ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE
          ) {
            return true;
          }
          return value ? true : "リンク先ページを選択してください";
        }),
    }),
    defineField({
      name: "targetAnchor",
      title: "目次の項目（任意）",
      type: "string",
      description: "未指定の場合はページの先頭へ移動します。お知らせ編集画面で選択してください。",
      hidden: ({ document }) =>
        announcementDestination(document?.destinationType) !==
        ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE,
      validation: (Rule) =>
        Rule.custom((value) =>
          !value || (typeof value === "string" && /^sec-[^#]+$/u.test(value))
            ? true
            : "お知らせ編集画面で目次の項目を選び直してください",
        ),
    }),
    defineField({
      name: "slug",
      title: "公開URL（末尾の文字）",
      type: "slug",
      description:
        "URL全体ではなく、https://yia.jp/announcements/ の後に入る半角小文字の英数字とハイフンだけを入力します。例：summer-event",
      hidden: ({ document }) =>
        announcementDestination(document?.destinationType) ===
        ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE,
      options: {
        source: (doc: Record<string, unknown>) => {
          const title = doc.title as { _key: string; value: string }[] | undefined;
          return (
            title?.find((t) => t._key === "en")?.value ||
            title?.find((t) => t._key === "ja")?.value ||
            ""
          );
        },
      },
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (
            announcementDestination(context.document?.destinationType) ===
            ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE
          ) {
            return true;
          }
          return announcementSlugError(value) ?? true;
        }),
    }),
    defineField({
      name: "date",
      title: "掲載日",
      type: "date",
      description: "お知らせ一覧に表示する日付です。自動公開の予約日時ではありません。",
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (Rule) => Rule.required().error("日付は必須です"),
    }),
    defineField({
      name: "pinned",
      title: "固定表示",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "heroImage",
      title: "ヒーロー画像",
      type: "image",
      options: { hotspot: true },
      hidden: ({ document }) =>
        announcementDestination(document?.destinationType) ===
        ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE,
    }),
    defineField({
      name: "excerpt",
      title: "抜粋",
      type: "internationalizedArrayText",
      hidden: ({ document }) =>
        announcementDestination(document?.destinationType) ===
        ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE,
    }),
    defineField({
      name: "body",
      title: "本文",
      type: "internationalizedArrayBlockContent",
      hidden: ({ document }) =>
        announcementDestination(document?.destinationType) ===
        ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE,
    }),
    defineField({
      name: "documents",
      title: "資料",
      type: "array",
      of: [{ type: "documentLink" }],
      hidden: ({ document }) =>
        announcementDestination(document?.destinationType) ===
        ANNOUNCEMENT_DESTINATION_INTERNAL_PAGE,
    }),
    // Legacy fields — kept for backward compatibility
    defineField({
      name: "content",
      title: "内容（旧）",
      type: "internationalizedArrayBlockContent",
      hidden: true,
    }),
    defineField({
      name: "image",
      title: "画像（旧）",
      type: "image",
      hidden: true,
    }),
  ],
});
