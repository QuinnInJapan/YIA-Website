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
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  const categoryIds = await getCategoryIdsStatic();

  return [
    { category: "announcements" },
    ...categoryIds.map((s) => ({ category: s })),
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const data = await getSiteData();
  const categoryIds = await getCategoryIds();

  let title = "";
  let description = "";

  if (category === "announcements") {
    title = "お知らせ";
    description = "横須賀国際交流協会からのお知らせ一覧";
  } else if (categoryIds.includes(category)) {
    const catIndex = await getCategoryIndex();
    const cat = catIndex[category];
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

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;

  if (category === "announcements") {
    return <AnnouncementsPageTemplate />;
  }

  const categoryIds = await getCategoryIds();
  if (categoryIds.includes(category)) {
    return <CategoryTemplate categoryId={category} />;
  }

  notFound();
}
