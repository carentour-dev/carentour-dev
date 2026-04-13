import type {
  BlogBlockContextEntity,
  LocalizedBlogPost,
} from "@/lib/blog/server";
import type { BlockInstance } from "@/lib/cms/blocks";

export type BlogPostFeedBlockContext = {
  blog?: BlogBlockContextEntity | null;
};

export function resolveBlogPostFeedQuery(
  block: BlockInstance<"blogPostFeed">,
  context?: BlogPostFeedBlockContext,
) {
  const blog = context?.blog;

  switch (block.source) {
    case "featured":
      return {
        featuredOnly: true,
        limit: block.limit,
      };
    case "manual":
      return {
        manualBaseSlugs: block.manualPostSlugs,
        limit: block.limit,
      };
    case "category":
      return {
        categoryId:
          blog?.type === "category"
            ? blog.category.id
            : blog?.type === "post"
              ? blog.post.category?.id
              : null,
        limit: block.limit,
      };
    case "tag":
      return {
        tagId: blog?.type === "tag" ? blog.tag.id : null,
        limit: block.limit,
      };
    case "author":
      return {
        authorId:
          blog?.type === "author"
            ? blog.author.id
            : blog?.type === "post"
              ? blog.post.author?.id
              : null,
        limit: block.limit,
      };
    case "related":
      return {
        categoryId:
          blog?.type === "post" ? (blog.post.category?.id ?? null) : null,
        excludePostId: blog?.type === "post" ? blog.post.id : null,
        limit: block.limit,
      };
    case "latest":
    default:
      return {
        limit: block.limit,
      };
  }
}

export function selectPreviewBlogPostFeedItems(input: {
  block: BlockInstance<"blogPostFeed">;
  context?: BlogPostFeedBlockContext;
  posts: LocalizedBlogPost[];
}) {
  const query = resolveBlogPostFeedQuery(input.block, input.context);
  const manualBaseSlugs = (query.manualBaseSlugs ?? [])
    .map((slug) => slug.trim())
    .filter(Boolean);
  let posts = [...input.posts];

  if (manualBaseSlugs.length > 0) {
    const orderMap = new Map(
      manualBaseSlugs.map((slug, index) => [slug, index]),
    );
    posts = posts
      .filter((post) => manualBaseSlugs.includes(post.base_slug))
      .sort((a, b) => {
        const rankA = orderMap.get(a.base_slug) ?? 9999;
        const rankB = orderMap.get(b.base_slug) ?? 9999;
        return rankA - rankB;
      });
  }

  if (query.featuredOnly) {
    posts = posts.filter((post) => post.featured === true);
  }

  if (query.categoryId) {
    posts = posts.filter((post) => post.category?.id === query.categoryId);
  }

  if (query.tagId) {
    posts = posts.filter((post) =>
      post.tags.some((tag) => tag.id === query.tagId),
    );
  }

  if (query.authorId) {
    posts = posts.filter((post) => post.author?.id === query.authorId);
  }

  if (query.excludePostId) {
    posts = posts.filter((post) => post.id !== query.excludePostId);
  }

  return posts.slice(0, query.limit);
}
