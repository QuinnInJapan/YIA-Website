import type { Metadata } from "next";
import Link from "next/link";
import { fetchBlogPosts, fetchBlogPostCount } from "@/lib/sanity/queries";
import { ja, en } from "@/lib/i18n";
import { imageUrl } from "@/lib/sanity/image";
import { formatDateDot } from "@/lib/date-format";
import { SolidHero } from "@/components/PageHero";
import PageLayout from "@/components/PageLayout";
import LazyImage from "@/components/LazyImage";
import Pagination from "@/components/Pagination";
import type { BlogPost } from "@/lib/types";

const PAGE_SIZE = 10;

export const metadata: Metadata = {
  title: "ブログ | 横須賀国際交流協会",
  description: "横須賀国際交流協会のブログ記事一覧。イベントレポート、文化、コミュニティの話題をお届けします。",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogIndexPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [posts, totalCount] = await Promise.all([
    fetchBlogPosts(currentPage, PAGE_SIZE),
    fetchBlogPostCount(),
  ]);
  const allPosts = ((posts) ?? []) as BlogPost[];
  const totalPages = Math.ceil((totalCount as number) / PAGE_SIZE);

  return (
    <PageLayout
      heroHtml={<SolidHero titleJa="ブログ" titleEn="Blog" />}
      mainClass="layout-category"
      sectionHtml={
        allPosts.length > 0 ? (
          <>
            <div className="cat-list">
              {allPosts.map((post) => {
                const heroSrc = imageUrl(post.heroImage);
                const dateStr = post.publishedAt
                  ? formatDateDot(post.publishedAt.slice(0, 10))
                  : "";

                return (
                  <article
                    className={`cat-item${heroSrc ? "" : " cat-item--no-img"}`}
                    key={post._id}
                  >
                    {heroSrc && (
                      <div className="cat-item__img-wrap">
                        <LazyImage
                          src={heroSrc}
                          alt={ja(post.heroImage?.alt) || ja(post.title)}
                          fill
                          className="cat-item__img"
                        />
                      </div>
                    )}
                    <div className="cat-item__body">
                      <h2 className="cat-item__title">
                        <Link href={`/blog/${post.slug}`} className="cat-item__link">
                          {ja(post.title)}
                        </Link>
                        {en(post.title) && (
                          <span className="cat-item__title-en" lang="en" translate="no">
                            {en(post.title)}
                          </span>
                        )}
                      </h2>
                      <div className="cat-item__meta">
                        {ja(post.category) && (
                          <span className="cat-item__category">
                            {ja(post.category)}
                          </span>
                        )}
                        {dateStr && (
                          <time className="cat-item__date">{dateStr}</time>
                        )}
                      </div>
                      {ja(post.excerpt) && (
                        <p className="cat-item__excerpt">{ja(post.excerpt)}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath="/blog"
            />
          </>
        ) : (
          <p className="blog-empty">まだ記事がありません。 No posts yet.</p>
        )
      }
    />
  );
}
