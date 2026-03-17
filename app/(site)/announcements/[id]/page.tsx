import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchAnnouncementById,
  fetchAnnouncementBySlug,
  fetchAllAnnouncementIdsStatic,
} from "@/lib/sanity/queries";
import { ja, en } from "@/lib/i18n";
import { imageUrl } from "@/lib/sanity/image";
import { resolveDocs } from "@/lib/sanity/image";
import { formatDateDot } from "@/lib/date-format";
import { SolidHero } from "@/components/PageHero";
import PageLayout from "@/components/PageLayout";
import DocList from "@/components/DocList";
import LazyImage from "@/components/LazyImage";
import BilingualPortableText from "@/components/BilingualPortableText";
import type { Announcement } from "@/lib/types";

/** Try slug first, fall back to _id lookup */
async function fetchAnnouncement(id: string): Promise<Announcement | null> {
  const bySlug = await fetchAnnouncementBySlug(id);
  if (bySlug) return bySlug as Announcement;
  return (await fetchAnnouncementById(id)) as Announcement | null;
}

export async function generateStaticParams() {
  const items = await fetchAllAnnouncementIdsStatic();
  const params: { id: string }[] = [];
  for (const item of items ?? []) {
    if (item.slug) params.push({ id: item.slug });
    params.push({ id: item._id });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ann = await fetchAnnouncement(id);
  if (!ann) return {};
  return {
    title: `${ja(ann.title)} | お知らせ | 横須賀国際交流協会`,
    description: en(ann.title) || undefined,
  };
}

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ann = await fetchAnnouncement(id);
  if (!ann) notFound();

  const dateStr = ann.date ? formatDateDot(ann.date) : "";
  const bodyField = ann.body ?? ann.content;
  const heroImg = ann.heroImage ?? ann.image;

  return (
    <PageLayout
      heroHtml={<SolidHero titleJa="お知らせ" titleEn="Announcements" />}
      mainClass="layout-program"
      sectionHtml={
        <article className="announcement-detail">
          <div className="announcement-detail__meta">
            {dateStr && (
              <time className="announcement-detail__date" dateTime={ann.date}>
                {dateStr}
              </time>
            )}
            {ann.pinned && <span className="announcement__pin">固定 Pinned</span>}
          </div>
          <h1 className="announcement-detail__title">
            {ja(ann.title)}
            {en(ann.title) && (
              <span className="announcement-detail__title-en" lang="en" translate="no">
                {en(ann.title)}
              </span>
            )}
          </h1>
          <BilingualPortableText field={bodyField} />
          {heroImg?.asset?._ref && (
            <div className="announcement-detail__image">
              <LazyImage src={imageUrl(heroImg)} alt={ja(ann.title)} />
            </div>
          )}
          {ann.documents && ann.documents.length > 0 && (
            <div className="announcement-detail__docs">
              <DocList docs={resolveDocs(ann.documents)} />
            </div>
          )}
        </article>
      }
    />
  );
}
