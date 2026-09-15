import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryIndex, getCategoryIds, getCategoryIdsStatic } from "@/lib/data";
import { ja } from "@/lib/i18n";
import { pageMetadata } from "@/lib/site-metadata";
import CategoryTemplate from "@/components/templates/CategoryTemplate";

// Refresh through the authenticated Sanity webhook, not on a timer.
export const revalidate = false;

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  const categoryIds = await getCategoryIdsStatic();

  return categoryIds.filter((s) => s !== "announcements").map((s) => ({ category: s }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryIds = await getCategoryIds();

  let title = "";
  let description = "";

  if (categoryIds.includes(category)) {
    const catIndex = await getCategoryIndex();
    const cat = catIndex[category];
    if (cat) {
      title = ja(cat.label);
      description = ja(cat.description);
    }
  }

  return pageMetadata({ title, description, pathname: `/${category}` });
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;

  const categoryIds = await getCategoryIds();
  if (categoryIds.includes(category)) {
    return <CategoryTemplate categoryId={category} />;
  }

  notFound();
}
