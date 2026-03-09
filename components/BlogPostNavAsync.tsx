import { fetchAdjacentBlogPosts } from "@/lib/sanity/queries";
import BlogPostNav from "./BlogPostNav";

interface BlogPostNavAsyncProps {
  publishedAt: string;
  slug: string;
}

export default async function BlogPostNavAsync({ publishedAt, slug }: BlogPostNavAsyncProps) {
  const adjacent = await fetchAdjacentBlogPosts(publishedAt, slug);
  return <BlogPostNav prev={adjacent.prev} next={adjacent.next} />;
}
