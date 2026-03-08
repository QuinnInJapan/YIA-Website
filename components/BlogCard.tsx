import Link from "next/link";
import { ja, en } from "@/lib/i18n";
import { imageUrl } from "@/lib/sanity/image";
import { formatDateDot } from "@/lib/date-format";
import LazyImage from "@/components/LazyImage";
import type { BlogPost } from "@/lib/types";

const CATEGORY_LABELS: Record<string, { ja: string; en: string }> = {
  "event-report": { ja: "イベントレポート", en: "Event Report" },
  culture: { ja: "文化", en: "Culture" },
  community: { ja: "コミュニティ", en: "Community" },
  news: { ja: "お知らせ", en: "News" },
};

export default function BlogCard({ post }: { post: BlogPost }) {
  const heroSrc = imageUrl(post.heroImage);
  const catLabel = post.category ? CATEGORY_LABELS[post.category] : null;
  const dateStr = post.publishedAt
    ? formatDateDot(post.publishedAt.slice(0, 10))
    : "";

  return (
    <Link href={`/blog/${post.slug}`} className="blog-card">
      <div className="blog-card__image-wrap">
        {heroSrc ? (
          <LazyImage
            src={heroSrc}
            alt={ja(post.heroImage?.alt) || ja(post.title)}
          />
        ) : (
          <div className="blog-card__image-placeholder" />
        )}
      </div>
      <div className="blog-card__body">
        <div className="blog-card__meta">
          {catLabel && (
            <span
              className={`blog-card__category blog-card__category--${post.category}`}
            >
              {catLabel.ja}
            </span>
          )}
          {dateStr && <time className="blog-card__date">{dateStr}</time>}
        </div>
        <h3 className="blog-card__title">{ja(post.title)}</h3>
        {en(post.title) && (
          <p className="blog-card__title-en" lang="en">
            {en(post.title)}
          </p>
        )}
        {ja(post.excerpt) && (
          <p className="blog-card__excerpt">{ja(post.excerpt)}</p>
        )}
      </div>
    </Link>
  );
}
