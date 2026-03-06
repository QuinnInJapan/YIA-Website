import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getSiteData,
  getPage,
  getEnrichedNavigation,
  shortId,
} from "@/lib/data";
import { ja } from "@/lib/i18n";
import PageTemplate from "@/components/templates/PageTemplate";
import { SolidHero } from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import AccessSection from "@/components/AccessSection";
import SiteFooter from "@/components/SiteFooter";

interface PageProps {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateStaticParams() {
  const { client } = await import("@/lib/sanity/client");
  const nav = await client.fetch<{
    categories: {
      categoryRef: { _id: string };
      items: { pageRef: { slug: string } }[];
    }[];
  }>(
    `*[_type == "navigation"][0]{
      categories[]{
        categoryRef->{ _id },
        items[]{ pageRef->{ slug } }
      }
    }`
  );

  const params: { category: string; slug: string }[] = [];

  for (const navCat of nav?.categories ?? []) {
    const catId = navCat.categoryRef?._id;
    if (!catId) continue;
    const dash = catId.indexOf("-");
    const category = dash >= 0 ? catId.slice(dash + 1) : catId;

    for (const item of navCat.items ?? []) {
      if (item.pageRef?.slug) {
        params.push({ category, slug: item.pageRef.slug });
      }
    }
  }

  // Contact page lives under /about/contact
  params.push({ category: "about", slug: "contact" });

  return params;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const data = await getSiteData();

  if (slug === "contact" && category === "about") {
    return {
      title: "お問い合わせ",
      openGraph: {
        title: `お問い合わせ — ${ja(data.site.org.name)}`,
      },
    };
  }

  const pg = await getPage(slug);
  if (!pg) return {};

  const title = ja(pg.title);
  const description = ja(pg.description);
  return {
    title,
    description,
    openGraph: {
      title: `${title} — ${ja(data.site.org.name)}`,
      description,
    },
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

  // Contact page
  if (slug === "contact" && category === "about") {
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

  // Regular page
  const pg = await getPage(slug);
  if (!pg) return notFound();

  return <PageTemplate page={pg} />;
}
