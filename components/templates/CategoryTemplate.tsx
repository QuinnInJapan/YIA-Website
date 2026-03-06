import Link from "next/link";
import { stegaClean } from "next-sanity";
import { getEnrichedNavigation, getPage } from "@/lib/data";
import { ja, en } from "@/lib/i18n";
import { imageUrl, hotspotPosition } from "@/lib/sanity/image";
import PageHero from "@/components/PageHero";
import PageLayout from "@/components/PageLayout";
import LazyImage from "@/components/LazyImage";
import BilingualPortableText from "@/components/BilingualPortableText";

interface CategoryTemplateProps {
  categoryId: string;
}

export default async function CategoryTemplate({
  categoryId,
}: CategoryTemplateProps) {
  const nav = await getEnrichedNavigation();
  const navCat = nav.categories.find((c) => c.categoryId === categoryId);

  if (!navCat) return null;

  // Resolve full page data for each nav item (nav is the source of truth for what belongs in a category)
  const items = await Promise.all(
    navCat.items.map(async (item) => {
      const slug = item.url.replace(/^\//, "");
      const page = slug ? await getPage(slug) : undefined;
      return { item, page };
    })
  );

  const categoryHeroImage = navCat.heroImage;

  const heroHtml = (
    <PageHero
      titleJa={ja(navCat.label)}
      titleEn={en(navCat.label)}
      images={
        categoryHeroImage ? [{ file: categoryHeroImage }] : undefined
      }
    />
  );

  const sectionHtml = (
    <div className="cat-list">
      {items.map(({ item, page }) => {
        const url = item.url;
        const title = page?.title ?? item.title;
        const pageImage = page?.images?.[0]?.file;
        const img = pageImage ? imageUrl(pageImage) : "";
        const pos = pageImage ? hotspotPosition(pageImage) : undefined;

        return (
          <article className={`cat-item${img ? "" : " cat-item--no-img"}`} key={stegaClean(item.id)}>
            {img && (
              <div className="cat-item__img-wrap">
                <LazyImage
                  src={img}
                  alt=""
                  fill
                  className="cat-item__img"
                  style={pos ? { objectPosition: pos } : undefined}
                />
              </div>
            )}
            <div className="cat-item__body">
              <h2 className="cat-item__title">
                <Link href={url} className="cat-item__link">
                  {ja(title)}
                </Link>
                {en(title) && (
                  <span className="cat-item__title-en" lang="en">
                    {en(title)}
                  </span>
                )}
              </h2>
              {page?.description && (
                <BilingualPortableText
                  field={page.description}
                  className="cat-item__desc"
                />
              )}
            </div>
          </article>
        );
      })}
    </div>
  );

  return (
    <PageLayout
      heroHtml={heroHtml}
      sectionHtml={sectionHtml}
      mainClass="layout-program"
    />
  );
}
