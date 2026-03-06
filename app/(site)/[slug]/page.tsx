import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getSiteData,
  getPage,
  getAllPageSlugs,
  getCategoryIndex,
} from "@/lib/data";
import { ja } from "@/lib/i18n";
import PageTemplate from "@/components/templates/PageTemplate";
import AnnouncementsPageTemplate from "@/components/templates/AnnouncementsPageTemplate";
import CategoryTemplate from "@/components/templates/CategoryTemplate";

const CATEGORY_SLUGS = ["support", "learning", "events", "exchange"];

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs: { slug: string }[] = [];

  // Announcements
  slugs.push({ slug: "announcements" });
  // Category landing pages
  for (const s of CATEGORY_SLUGS) {
    slugs.push({ slug: s });
  }
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
  } else if (CATEGORY_SLUGS.includes(slug)) {
    const catIndex = await getCategoryIndex();
    const cat = catIndex[slug];
    if (cat) {
      title = ja(cat.label);
      description = ja(cat.description);
    }
  } else {
    const pg = await getPage(slug);
    if (pg) {
      title = ja(pg.title);
      description = ja(pg.description);
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

  if (CATEGORY_SLUGS.includes(slug)) {
    return <CategoryTemplate categoryId={slug} />;
  }

  const pg = await getPage(slug);
  if (pg) {
    return <PageTemplate page={pg} />;
  }

  notFound();
}
