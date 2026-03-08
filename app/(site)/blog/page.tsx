import type { Metadata } from "next";
import { fetchBlogPosts } from "@/lib/sanity/queries";
import { SolidHero } from "@/components/PageHero";
import PageLayout from "@/components/PageLayout";
import BlogCard from "@/components/BlogCard";
import type { BlogPost } from "@/lib/types";

export const metadata: Metadata = {
  title: "ブログ | 横須賀国際交流協会",
  description: "横須賀国際交流協会のブログ記事一覧。イベントレポート、文化、コミュニティの話題をお届けします。",
};

export default async function BlogIndexPage() {
  const posts = ((await fetchBlogPosts()) ?? []) as BlogPost[];

  return (
    <PageLayout
      heroHtml={<SolidHero titleJa="ブログ" titleEn="Blog" />}
      sectionHtml={
        posts.length > 0 ? (
          <div className="blog-grid">
            {posts.map((post) => (
              <BlogCard key={post._id} post={post} />
            ))}
          </div>
        ) : (
          <p className="blog-empty">まだ記事がありません。 No posts yet.</p>
        )
      }
    />
  );
}
