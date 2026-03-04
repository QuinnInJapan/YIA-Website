import { getSiteData, getAnnouncementsByIds } from "@/lib/data";
import { Nl2br } from "@/lib/helpers";
import { resolveImage } from "@/lib/images";
import { formatDateDot } from "@/lib/date-format";
import { SolidHero } from "@/components/PageHero";
import PageLayout from "@/components/PageLayout";
import DocList from "@/components/DocList";
import LazyImage from "@/components/LazyImage";
import SidebarToc from "@/components/SidebarToc";

export default async function AnnouncementsPageTemplate() {
  const data = await getSiteData();
  const hp = data.homepage;
  const allAnnouncements = await getAnnouncementsByIds(hp.announcementIds);

  const tocEntries = allAnnouncements.map((a, i) => ({
    id: a.id || `ann-${i}`,
    textJa: a.titleJa,
    textEn: a.titleEn || "",
  }));

  const tocHtml = <SidebarToc entries={tocEntries} />;

  const articles = allAnnouncements.map((a, i) => {
    const id = a.id || `ann-${i}`;
    return (
      <article className="announcement" id={id} key={id}>
        {a.date && (
          <time className="announcement__date" dateTime={a.date}>
            {formatDateDot(a.date)}
          </time>
        )}
        <h2 className="announcement__title">
          {a.titleJa}
          {a.titleEn && (
            <span className="announcement__title-en" lang="en"> {a.titleEn}</span>
          )}
        </h2>
        <div className="announcement__content" lang="ja">
          <Nl2br text={a.contentJa} />
        </div>
        <div className="announcement__content" lang="en">
          <Nl2br text={a.contentEn} />
        </div>
        {a.image && (
          <div className="announcement__image">
            <LazyImage src={resolveImage(a.image)} alt={a.titleJa} />
          </div>
        )}
        {a.documents && a.documents.length > 0 && (
          <div className="announcement__docs">
            <DocList docs={a.documents} />
          </div>
        )}
      </article>
    );
  });

  return (
    <PageLayout
      heroHtml={
        <SolidHero titleJa="お知らせ" titleEn="Announcements" />
      }
      tocHtml={tocHtml}
      sectionHtml={<>{articles}</>}
    />
  );
}
