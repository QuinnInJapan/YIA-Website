import { Suspense } from "react";
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
import BlogLanguageTabs, { BlogLanguageProvider } from "@/components/BlogLanguageTabs";
import BlogPostNavAsync from "@/components/BlogPostNavAsync";
import BlogTocWrapper from "./BlogTocWrapper";
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

  // Build separate TOC entries for each language from their own h2 headings
  type PtBlock = { _key?: string; _type: string; style?: string; children?: { text?: string }[] };
  function buildTocEntries(blocks: PtBlock[]) {
    return blocks
      .filter((b) => b._type === "block" && b.style === "h2" && b._key)
      .map((h) => ({
        id: h._key!,
        text: h.children?.map((c) => c.text || "").join("") || "",
      }));
  }
  const jaTocEntries = buildTocEntries(jaB as PtBlock[]);
  const enTocEntries = buildTocEntries(enB as PtBlock[]);

  const heroHtml = (
    <div className={`blog-post__hero${heroSrc ? "" : " blog-post__hero--no-image"}`}>
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
          <p className="blog-post__title-en" lang="en" translate="no">{en(post.title)}</p>
        )}
        <div className="blog-post__meta">
          {dateStr && <time>{dateStr}</time>}
          {post.author && <span>{post.author}</span>}
        </div>
      </div>
    </div>
  );

  const jaBody = hasContent(jaB) ? (
    <div className="blog-post__body-ja">
      <PortableText value={jaB} components={blogPtComponents} />
    </div>
  ) : null;

  const enBody = hasContent(enB) ? (
    <div className="blog-post__body-en" lang="en" translate="no">
      <PortableText value={enB} components={blogPtComponents} />
    </div>
  ) : null;

  const hasEn = hasContent(enB);

  const sectionHtml = (
    <article className="blog-post__body">
      <BlogLanguageProvider hasEn={hasEn}>
        <BlogTocWrapper jaEntries={jaTocEntries} enEntries={enTocEntries} />
        <BlogLanguageTabs
          jaContent={jaBody}
          enContent={enBody}
        />

        {post.documents && post.documents.length > 0 && (
          <div className="blog-post__docs">
            <DocList docs={resolveDocs(post.documents)} />
          </div>
        )}

        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <section className="blog-post__related">
            <h2>関連記事 <span lang="en" translate="no">Related Posts</span></h2>
            <div className="blog-grid blog-grid--related">
              {post.relatedPosts.map((related) => (
                <BlogCard key={related._id} post={related} />
              ))}
            </div>
          </section>
        )}

        <Suspense>
          {post.publishedAt && (
            <BlogPostNavAsync publishedAt={post.publishedAt} slug={post.slug} />
          )}
        </Suspense>
      </BlogLanguageProvider>
    </article>
  );

  return <PageLayout heroHtml={heroHtml} sectionHtml={sectionHtml} mainClass="layout-program" />;
}
