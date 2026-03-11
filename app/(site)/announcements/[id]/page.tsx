import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchAnnouncementById,
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

export async function generateStaticParams() {
  const items = await fetchAllAnnouncementIdsStatic();
  return (items ?? []).map(({ _id }) => ({ id: _id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ann = (await fetchAnnouncementById(id)) as Announcement | null;
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
  const ann = (await fetchAnnouncementById(id)) as Announcement | null;
  if (!ann) notFound();

  const dateStr = ann.date ? formatDateDot(ann.date) : "";

  return (
    <PageLayout
      heroHtml={
        <SolidHero titleJa="お知らせ" titleEn="Announcements" />
      }
      mainClass="layout-program"
      sectionHtml={
        <article className="announcement-detail">
          <div className="announcement-detail__meta">
            {dateStr && (
              <time className="announcement-detail__date" dateTime={ann.date}>
                {dateStr}
              </time>
            )}
            {ann.pinned && (
              <span className="announcement__pin">固定 Pinned</span>
            )}
          </div>
          <h1 className="announcement-detail__title">
            {ja(ann.title)}
            {en(ann.title) && (
              <span className="announcement-detail__title-en" lang="en" translate="no">
                {en(ann.title)}
              </span>
            )}
          </h1>
          <BilingualPortableText field={ann.content} />
          {ann.image?.asset?._ref && (
            <div className="announcement-detail__image">
              <LazyImage src={imageUrl(ann.image)} alt={ja(ann.title)} />
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
