import { stegaClean } from "next-sanity";
import { getSiteData, getAnnouncementsByRefs } from "@/lib/data";
import { ja, en } from "@/lib/i18n";
import { imageUrl } from "@/lib/sanity/image";
import { formatDateDot } from "@/lib/date-format";
import { SolidHero } from "@/components/PageHero";
import PageLayout from "@/components/PageLayout";
import DocList from "@/components/DocList";
import { resolveDocs } from "@/lib/sanity/image";
import LazyImage from "@/components/LazyImage";
import SidebarToc from "@/components/SidebarToc";
import BilingualPortableText from "@/components/BilingualPortableText";

export default async function AnnouncementsPageTemplate() {
  const data = await getSiteData();
  const hp = data.homepage;
  const allAnnouncements = await getAnnouncementsByRefs(hp.announcementRefs);

  const tocEntries = allAnnouncements.map((a, i) => ({
    id: stegaClean(a.id) || `ann-${i}`,
    textJa: ja(a.title),
    textEn: en(a.title),
  }));

  const tocHtml = <SidebarToc entries={tocEntries} />;

  const articles = allAnnouncements.map((a, i) => {
    const id = stegaClean(a.id) || `ann-${i}`;
    return (
      <article className="announcement" id={id} key={id}>
        {a.date && (
          <time className="announcement__date" dateTime={a.date}>
            {formatDateDot(a.date)}
          </time>
        )}
        <h2 className="announcement__title">
          {ja(a.title)}
          {en(a.title) && (
            <span className="announcement__title-en" lang="en"> {en(a.title)}</span>
          )}
        </h2>
        <BilingualPortableText field={a.content} />
        {a.image?.asset?._ref && (
          <div className="announcement__image">
            <LazyImage src={imageUrl(a.image)} alt={ja(a.title)} />
          </div>
        )}
        {a.documents && a.documents.length > 0 && (
          <div className="announcement__docs">
            <DocList docs={resolveDocs(a.documents)} />
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
