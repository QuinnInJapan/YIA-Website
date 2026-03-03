import { getSiteData, getAnnouncementsByIds } from "@/lib/data";
import { Nl2br } from "@/lib/helpers";
import { resolveImage } from "@/lib/images";
import { SolidHero } from "@/components/PageHero";
import PageLayout from "@/components/PageLayout";
import DocList from "@/components/DocList";
import LazyImage from "@/components/LazyImage";

export default function AnnouncementsPageTemplate() {
  const data = getSiteData();
  const hp = data.homepage;
  const allAnnouncements = getAnnouncementsByIds(hp.announcementIds);

  const tocHtml = (
    <nav className="ann-toc" aria-label="目次">
      <div className="ann-toc__label">
        目次 <span>Contents</span>
      </div>
      {allAnnouncements.map((a, i) => {
        const id = a.id || `ann-${i}`;
        return (
          <a href={`#${id}`} className="ann-toc__link" key={id}>
            {a.titleJa}
          </a>
        );
      })}
    </nav>
  );

  const articles = allAnnouncements.map((a, i) => {
    const id = a.id || `ann-${i}`;
    return (
      <article className="announcement" id={id} key={id}>
        <h2 className="announcement__title">
          {a.titleJa}
          {a.titleEn && (
            <span className="announcement__title-en"> {a.titleEn}</span>
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
            <LazyImage src={resolveImage(a.image)} alt="" />
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
