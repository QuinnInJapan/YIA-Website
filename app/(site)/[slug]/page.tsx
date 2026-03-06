import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getSiteData,
  getCategoryIndex,
  getCategoryIds,
  getCategoryIdsStatic,
} from "@/lib/data";
import { ja } from "@/lib/i18n";
import AnnouncementsPageTemplate from "@/components/templates/AnnouncementsPageTemplate";
import CategoryTemplate from "@/components/templates/CategoryTemplate";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const categoryIds = await getCategoryIdsStatic();

  return [
    { slug: "announcements" },
    ...categoryIds.map((s) => ({ slug: s })),
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSiteData();
  const categoryIds = await getCategoryIds();

  let title = "";
  let description = "";

  if (slug === "announcements") {
    title = "お知らせ";
    description = "横須賀国際交流協会からのお知らせ一覧";
  } else if (categoryIds.includes(slug)) {
    const catIndex = await getCategoryIndex();
    const cat = catIndex[slug];
    if (cat) {
      title = ja(cat.label);
      description = ja(cat.description);
    }
  }

  return {
    title,
    description,
    openGraph: {
      title: `${title} — ${ja(data.site.org.name)}`,
      description,
    },
  };
}

export default async function SlugPage({ params }: PageProps) {
  const { slug } = await params;

  if (slug === "announcements") {
    return <AnnouncementsPageTemplate />;
  }

  const categoryIds = await getCategoryIds();
  if (categoryIds.includes(slug)) {
    return <CategoryTemplate categoryId={slug} />;
  }

  notFound();
}
