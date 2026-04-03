import Image from "next/image";
import Link from "next/link";

import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveBlogUiText } from "@/lib/blog/localization";
import type {
  BlogBlockContextEntity,
  LocalizedBlogPost,
} from "@/lib/blog/server";
import type { BlockInstance } from "@/lib/cms/blocks";
import { cn } from "@/lib/utils";

import { BlockSurface } from "./BlockSurface";

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

export function BlogPostFeedContent({
  block,
  posts,
  context,
  locale,
}: {
  block: BlockInstance<"blogPostFeed">;
  posts: LocalizedBlogPost[];
  context?: BlogPostFeedBlockContext;
  locale: "en" | "ar";
}) {
  const blog = context?.blog;
  const relatedHeading = resolveBlogUiText(
    "relatedHeading",
    locale,
    block.relatedHeading,
  );
  const featuredBadge = resolveBlogUiText(
    "featuredBadge",
    locale,
    block.featuredBadge,
  );
  const listCtaLabel = resolveBlogUiText(
    "listCtaLabel",
    locale,
    block.listCtaLabel,
  );
  const emptyStateHeading = resolveBlogUiText(
    "feedEmptyStateHeading",
    locale,
    block.emptyStateHeading,
  );
  const emptyStateDescription = resolveBlogUiText(
    "feedEmptyStateDescription",
    locale,
    block.emptyStateDescription,
  );
  const dynamicHeading =
    block.source === "category" && blog?.type === "category"
      ? blog.category.name
      : block.source === "tag" && blog?.type === "tag"
        ? `#${blog.tag.name}`
        : block.source === "author" && blog?.type === "author"
          ? blog.author.name
          : block.source === "related"
            ? relatedHeading
            : null;
  const dynamicDescription =
    block.source === "category" && blog?.type === "category"
      ? blog.category.description
      : block.source === "tag" && blog?.type === "tag"
        ? blog.tag.description
        : block.source === "author" && blog?.type === "author"
          ? blog.author.bio
          : null;
  const heading = block.heading || dynamicHeading;
  const description = block.description || dynamicDescription;

  return (
    <BlockSurface
      block={block}
      defaultPadding={{ top: "4.5rem", bottom: "4.5rem" }}
      contentClassName="space-y-8"
    >
      {() => (
        <>
          {block.eyebrow || heading || description ? (
            <div className="mx-auto max-w-3xl text-center">
              {block.eyebrow ? (
                <Badge variant="outline" className="mb-4">
                  {block.eyebrow}
                </Badge>
              ) : null}
              {heading ? (
                <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
                  {heading}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-3 text-base text-muted-foreground md:text-lg">
                  {description}
                </p>
              ) : null}
            </div>
          ) : null}

          {posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                {emptyStateHeading}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {emptyStateDescription}
              </p>
            </div>
          ) : block.layout === "heroFeatured" ? (
            <div className="space-y-8">
              <article className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm">
                <div className="grid gap-0 lg:grid-cols-[1.2fr_1fr]">
                  <div className="relative min-h-[320px] bg-muted">
                    {posts[0]?.featured_image ? (
                      <Image
                        src={posts[0].featured_image}
                        alt={posts[0].title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 60vw, 100vw"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-col justify-center p-8 md:p-10">
                    <Badge variant="secondary" className="w-fit">
                      {featuredBadge}
                    </Badge>
                    <h3 className="mt-4 text-2xl font-semibold text-foreground md:text-3xl">
                      {posts[0].title}
                    </h3>
                    {posts[0].excerpt ? (
                      <p className="mt-4 text-base leading-7 text-muted-foreground">
                        {posts[0].excerpt}
                      </p>
                    ) : null}
                    <div className="mt-6">
                      <Button asChild>
                        <Link href={posts[0].path ?? "#"}>{listCtaLabel}</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </article>

              {posts.slice(1).length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {posts.slice(1).map((post) => (
                    <BlogPostCard key={post.id} post={post} locale={locale} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div
              className={cn(
                block.layout === "list" && "space-y-4",
                block.layout === "grid" &&
                  "grid gap-6 md:grid-cols-2 xl:grid-cols-3",
                block.layout === "carousel" &&
                  "flex gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              )}
            >
              {posts.map((post) =>
                block.layout === "list" ? (
                  <article
                    key={post.id}
                    className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-3">
                        {post.category ? (
                          <Badge
                            variant="outline"
                            className="w-fit"
                            style={
                              post.category.color
                                ? {
                                    borderColor: `${post.category.color}40`,
                                    color: post.category.color,
                                  }
                                : undefined
                            }
                          >
                            {post.category.name}
                          </Badge>
                        ) : null}
                        <h3 className="text-2xl font-semibold text-foreground">
                          {post.title}
                        </h3>
                        {post.excerpt ? (
                          <p className="max-w-3xl text-muted-foreground">
                            {post.excerpt}
                          </p>
                        ) : null}
                      </div>
                      <Button asChild variant="outline">
                        <Link href={post.path ?? "#"}>{listCtaLabel}</Link>
                      </Button>
                    </div>
                  </article>
                ) : (
                  <div
                    key={post.id}
                    className={cn(
                      block.layout === "carousel" && "w-[320px] flex-none",
                    )}
                  >
                    <BlogPostCard post={post} locale={locale} />
                  </div>
                ),
              )}
            </div>
          )}
        </>
      )}
    </BlockSurface>
  );
}
