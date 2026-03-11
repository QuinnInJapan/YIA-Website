import Link from "next/link";
import { ja, en } from "@/lib/i18n";
import { imageUrl } from "@/lib/sanity/image";
import { formatDateDot } from "@/lib/date-format";
import { SolidHero } from "@/components/PageHero";
import PageLayout from "@/components/PageLayout";
import LazyImage from "@/components/LazyImage";
import Pagination from "@/components/Pagination";
import {
  fetchAnnouncements,
  fetchAnnouncementCount,
} from "@/lib/sanity/queries";
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
      heroHtml={<SolidHero titleJa="お知らせ" titleEn="Announcements" />}
      mainClass="layout-category"
      sectionHtml={
        <>
          <div className="cat-list">
            {announcements.map((a) => {
              const img = a.image?.asset?._ref ? imageUrl(a.image) : "";
              const dateStr = a.date ? formatDateDot(a.date) : "";

              return (
                <article
                  className={`cat-item${img ? "" : " cat-item--no-img"}`}
                  key={a._id}
                >
                  {img && (
                    <div className="cat-item__img-wrap">
                      <LazyImage
                        src={img}
                        alt=""
                        fill
                        className="cat-item__img"
                      />
                    </div>
                  )}
                  <div className="cat-item__body">
                    <h2 className="cat-item__title">
                      <Link href={`/announcements/${a._id}`} className="cat-item__link">
                        {ja(a.title)}
                      </Link>
                      {en(a.title) && (
                        <span className="cat-item__title-en" lang="en" translate="no">
                          {en(a.title)}
                        </span>
                      )}
                    </h2>
                    <div className="cat-item__meta">
                      {a.pinned && (
                        <span className="announcement__pin">固定 Pinned</span>
                      )}
                      {dateStr && (
                        <time className="cat-item__date">{dateStr}</time>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/announcements"
          />
        </>
      }
    />
  );
}
