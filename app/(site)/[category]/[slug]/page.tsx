import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteData, getPage, getEnrichedNavigation } from "@/lib/data";
import { ja } from "@/lib/i18n";
import { socialMetadata } from "@/lib/site-metadata";
import { categorySegment } from "@/lib/routes";
import { fetchNavigationPageParamsStatic } from "@/lib/sanity/navigation-routes";
import PageTemplate from "@/components/templates/PageTemplate";
import { SolidHero } from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import AccessSection from "@/components/AccessSection";
import SiteFooter from "@/components/SiteFooter";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateStaticParams() {
  return fetchNavigationPageParamsStatic(categorySegment);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params;

  const pg = await getPage(slug);
  if (!pg) return {};

  const title = ja(pg.title);
  const description = ja(pg.description);
  return {
    title,
    description,
    ...socialMetadata({ title, description, pathname: `/${category}/${slug}` }),
  };
}

export default async function CategorySlugPage({ params }: PageProps) {
  const { category, slug } = await params;

  // Validate that this slug actually belongs to this category
  const nav = await getEnrichedNavigation();
  const navCat = nav.categories.find((c) => c.categoryId === category);
  if (!navCat) return notFound();

  const navItem = navCat.items.find((it) => it.slug === slug);
  if (!navItem) return notFound();

  const pg = await getPage(slug);
  if (!pg) return notFound();

  // Contact page uses a special template
  if (pg.template === "contact") {
    const data = await getSiteData();
    return (
      <>
        <SolidHero titleJa="お問い合わせ" titleEn="Contact" />
        <main id="main">
          <ContactForm />
          <AccessSection />
        </main>
        <SiteFooter documents={data.sidebar.documents} />
      </>
    );
  }

  return <PageTemplate page={pg} />;
}
