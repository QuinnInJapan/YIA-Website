import Link from "next/link";
import { ja, en } from "@/lib/i18n";
import { formatDateDot } from "@/lib/date-format";
import { SolidHero } from "@/components/PageHero";
import PageLayout from "@/components/PageLayout";
import Pagination from "@/components/Pagination";
import { fetchAnnouncements, fetchAnnouncementCount } from "@/lib/sanity/queries";
import type { Announcement } from "@/lib/types";

const PAGE_SIZE = 10;

interface Props {
  page?: number;
}

export default async function AnnouncementsPageTemplate({ page = 1 }: Props) {
  const [announcementsData, totalCount] = await Promise.all([
    fetchAnnouncements(page, PAGE_SIZE),
    fetchAnnouncementCount(),
  ]);
  const announcements = (announcementsData ?? []) as Announcement[];
  const totalPages = Math.ceil((totalCount as number) / PAGE_SIZE);

  return (
    <PageLayout
      heroHtml={<SolidHero titleJa="お知らせ" titleEn="Announcements" narrow />}
      mainClass="layout-category"
      sectionHtml={
        <>
          <Pagination currentPage={page} totalPages={totalPages} basePath="/announcements" />
          <div className="oshirase-list oshirase-list--page">
            {announcements.map((a) => {
              const dateStr = a.date ? formatDateDot(a.date) : "";

              return (
                <Link href={`/announcements/${a._id}`} className="oshirase-item" key={a._id}>
                  <span className="oshirase-date">
                    {dateStr}
                    {a.pinned && <span className="oshirase-pin">固定 Pinned</span>}
                  </span>
                  <span className="oshirase-title">
                    <span className="oshirase-title__ja">{ja(a.title)}</span>
                    {en(a.title) && (
                      <span className="oshirase-title__en" lang="en" translate="no">
                        {en(a.title)}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath="/announcements" />
        </>
      }
    />
  );
}
