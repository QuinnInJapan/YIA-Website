import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import {
  fetchBlogPostBySlug,
  fetchAllBlogSlugsStatic,
} from "@/lib/sanity/queries";
import { ja, en, jaBlocks, enBlocks } from "@/lib/i18n";
import { imageUrl, hotspotPosition, resolveDocs } from "@/lib/sanity/image";
import { formatDateDot } from "@/lib/date-format";
import { blogPtComponents } from "@/lib/portable-text";
import PageLayout from "@/components/PageLayout";
import DocList from "@/components/DocList";
import BlogCard from "@/components/BlogCard";
import type { BlogPost } from "@/lib/types";
import type { I18nBlocks } from "@/lib/i18n";

const CATEGORY_LABELS: Record<string, string> = {
  "event-report": "イベントレポート",
  culture: "文化",
  community: "コミュニティ",
  news: "お知らせ",
};

export async function generateStaticParams() {
  const slugs = await fetchAllBlogSlugsStatic();
  return (slugs ?? []).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = (await fetchBlogPostBySlug(slug)) as BlogPost | null;
  if (!post) return {};
  return {
    title: `${ja(post.title)} | ブログ | 横須賀国際交流協会`,
    description: ja(post.excerpt) || undefined,
  };
}

function hasContent(blocks: unknown[]): boolean {
  if (blocks.length === 0) return false;
  return blocks.some(
    (b: unknown) => {
      const block = b as { _type?: string; children?: { text?: string }[] };
      return (
        block._type !== "block" ||
        block.children?.some((c) => c.text?.trim())
      );
    },
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const maybePost = (await fetchBlogPostBySlug(slug)) as BlogPost | null;
  if (!maybePost) notFound();
  const post = maybePost;

  const heroSrc = imageUrl(post.heroImage);
  const heroPosition = hotspotPosition(post.heroImage);
  const dateStr = post.publishedAt
    ? formatDateDot(post.publishedAt.slice(0, 10))
    : "";
  const catLabel = post.category ? CATEGORY_LABELS[post.category] : null;

  const jaB = jaBlocks(post.body as I18nBlocks);
  const enB = enBlocks(post.body as I18nBlocks);

  const heroHtml = (
    <div className={`blog-post__hero${heroSrc ? "" : " blog-post__hero--solid"}`}>
      {heroSrc && (
        <Image
          src={heroSrc}
          alt={ja(post.heroImage?.alt) || ja(post.title)}
          fill
          sizes="100vw"
          className="blog-post__hero-img"
          style={heroPosition ? { objectPosition: heroPosition } : undefined}
          priority
        />
      )}
      <div className="blog-post__hero-overlay">
        {catLabel && (
          <span className={`blog-post__category blog-post__category--${post.category}`}>
            {catLabel}
          </span>
        )}
        <h1 className="blog-post__title">{ja(post.title)}</h1>
        {en(post.title) && (
          <p className="blog-post__title-en" lang="en">{en(post.title)}</p>
        )}
        <div className="blog-post__meta">
          {dateStr && <time>{dateStr}</time>}
          {post.author && <span>{post.author}</span>}
        </div>
      </div>
    </div>
  );

  const sectionHtml = (
    <article className="blog-post__body">
      {hasContent(jaB) && (
        <div className="blog-post__body-ja" lang="ja">
          <PortableText value={jaB} components={blogPtComponents} />
        </div>
      )}
      {hasContent(enB) && (
        <div className="blog-post__body-en" lang="en">
          <PortableText value={enB} components={blogPtComponents} />
        </div>
      )}

      {post.documents && post.documents.length > 0 && (
        <div className="blog-post__docs">
          <DocList docs={resolveDocs(post.documents)} />
        </div>
      )}

      {post.relatedPosts && post.relatedPosts.length > 0 && (
        <section className="blog-post__related">
          <h2>関連記事 <span lang="en">Related Posts</span></h2>
          <div className="blog-grid blog-grid--related">
            {post.relatedPosts.map((related) => (
              <BlogCard key={related._id} post={related} />
            ))}
          </div>
        </section>
      )}
    </article>
  );

  return <PageLayout heroHtml={heroHtml} sectionHtml={sectionHtml} />;
}
