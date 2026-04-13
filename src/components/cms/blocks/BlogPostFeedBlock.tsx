import { listLocalizedBlogPosts } from "@/lib/blog/server";
import type { BlockInstance } from "@/lib/cms/blocks";

import {
  resolveBlogPostFeedQuery,
  type BlogPostFeedBlockContext,
} from "./BlogPostFeedBlockContent";
import {
  BlogPostFeedInfiniteArchive,
  type BlogPostFeedInfiniteArchiveRequest,
} from "./BlogPostFeedInfiniteArchive";
import { BlogPostFeedSection } from "./BlogPostFeedSection";

function resolveInfiniteArchiveRequest(
  block: BlockInstance<"blogPostFeed">,
  context: BlogPostFeedBlockContext | undefined,
  locale: "en" | "ar",
): BlogPostFeedInfiniteArchiveRequest | null {
  const blog = context?.blog;

  if (block.source === "latest" && blog?.type === "landing") {
    return {
      scope: "latest",
      locale,
      limit: block.limit,
    };
  }

  if (block.source === "category" && blog?.type === "category") {
    return {
      scope: "category",
      locale,
      limit: block.limit,
      slug: blog.category.slug,
    };
  }

  if (block.source === "tag" && blog?.type === "tag") {
    return {
      scope: "tag",
      locale,
      limit: block.limit,
      slug: blog.tag.slug,
    };
  }

  if (block.source === "author" && blog?.type === "author") {
    return {
      scope: "author",
      locale,
      limit: block.limit,
      slug: blog.author.slug,
    };
  }

  return null;
}

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

  const infiniteArchiveRequest = resolveInfiniteArchiveRequest(
    block,
    context,
    locale,
  );

  if (infiniteArchiveRequest && result.totalPages > 1) {
    return (
      <BlogPostFeedInfiniteArchive
        block={block}
        locale={locale}
        context={context}
        request={infiniteArchiveRequest}
        initialPosts={result.posts}
        initialPagination={{
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        }}
      />
    );
  }

  return (
    <BlogPostFeedSection
      block={block}
      posts={result.posts}
      context={context}
      locale={locale}
    />
  );
}
