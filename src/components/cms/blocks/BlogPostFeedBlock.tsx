import { listLocalizedBlogPosts } from "@/lib/blog/server";
import type { BlockInstance } from "@/lib/cms/blocks";

import {
  BlogPostFeedContent,
  resolveBlogPostFeedQuery,
  type BlogPostFeedBlockContext,
} from "./BlogPostFeedBlockContent";

export async function BlogPostFeedBlock({
  block,
  context,
  locale,
}: {
  block: BlockInstance<"blogPostFeed">;
  context?: BlogPostFeedBlockContext;
  locale: "en" | "ar";
}) {
  const query = resolveBlogPostFeedQuery(block, context);
  const result = await listLocalizedBlogPosts({
    locale,
    limit: query.limit,
    featuredOnly: query.featuredOnly,
    manualBaseSlugs: query.manualBaseSlugs,
    categoryId: query.categoryId,
    tagId: query.tagId,
    authorId: query.authorId,
    excludePostId: query.excludePostId,
    publishedOnly: true,
  });

  return (
    <BlogPostFeedContent
      block={block}
      posts={result.posts}
      context={context}
      locale={locale}
    />
  );
}
