import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getSiteData,
  getPage,
  getAllPageSlugs,
} from "@/lib/data";
import PageTemplate from "@/components/templates/PageTemplate";
import AnnouncementsPageTemplate from "@/components/templates/AnnouncementsPageTemplate";
import HandbookPageTemplate from "@/components/templates/HandbookPageTemplate";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs: { slug: string }[] = [];

  // Announcements
  slugs.push({ slug: "announcements" });
  // Handbook
  slugs.push({ slug: "nihongo-handbook" });
  // All pages
  for (const s of await getAllPageSlugs()) {
    slugs.push({ slug: s });
  }

  return slugs;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSiteData();

  let title = "";
  let description = "";

  if (slug === "announcements") {
    title = "お知らせ";
    description = "横須賀国際交流協会からのお知らせ一覧";
  } else if (slug === "nihongo-handbook") {
    title = "日本語学習・生活";
    description = "日本での生活や日本語学習に役立つハンドブック";
  } else {
    const pg = await getPage(slug);
    if (pg) {
      title = pg.titleJa;
      description = pg.descriptionJa || "";
    }
  }

  return {
    title,
    description,
    openGraph: {
      title: `${title} — ${data.site.org.nameJa}`,
      description,
    },
  };
}

export default async function SlugPage({ params }: PageProps) {
  const { slug } = await params;

  if (slug === "announcements") {
    return <AnnouncementsPageTemplate />;
  }
  if (slug === "nihongo-handbook") {
    return <HandbookPageTemplate />;
  }

  const pg = await getPage(slug);
  if (pg) {
    return <PageTemplate page={pg} />;
  }

  notFound();
}
