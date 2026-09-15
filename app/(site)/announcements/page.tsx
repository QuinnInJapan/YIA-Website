import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site-metadata";
import AnnouncementsPageTemplate from "@/components/templates/AnnouncementsPageTemplate";

// Only the paginated listing needs request-time query parameters. Keep it out of
// the category route so ordinary categories retain their cached HTML.
export const revalidate = false;

export const metadata: Metadata = pageMetadata({
  title: "お知らせ",
  description: "横須賀国際交流協会からのお知らせ一覧",
  pathname: "/announcements",
});

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  return <AnnouncementsPageTemplate page={page} />;
}
