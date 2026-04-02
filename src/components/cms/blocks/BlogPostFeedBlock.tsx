import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import type { BlockInstance } from "@/lib/cms/blocks";
import type { BlogBlockContextEntity } from "@/lib/blog/server";
import { listLocalizedBlogPosts } from "@/lib/blog/server";
import { BlockSurface } from "./BlockSurface";
import { cn } from "@/lib/utils";

type BlogPostFeedBlockContext = {
  blog?: BlogBlockContextEntity | null;
};

function resolveFeedQuery(
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

export async function BlogPostFeedBlock({
  block,
  context,
  locale,
}: {
  block: BlockInstance<"blogPostFeed">;
  context?: BlogPostFeedBlockContext;
  locale: "en" | "ar";
}) {
  const query = resolveFeedQuery(block, context);
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
  const posts = result.posts;
  const blog = context?.blog;
  const dynamicHeading =
    block.source === "category" && blog?.type === "category"
      ? blog.category.name
      : block.source === "tag" && blog?.type === "tag"
        ? `#${blog.tag.name}`
        : block.source === "author" && blog?.type === "author"
          ? blog.author.name
          : block.source === "related"
            ? block.relatedHeading
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
                {block.emptyStateHeading}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {block.emptyStateDescription}
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
                      {block.featuredBadge}
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
                        <Link href={posts[0].path ?? "#"}>
                          {block.listCtaLabel}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </article>

              {posts.slice(1).length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {posts.slice(1).map((post) => (
                    <BlogPostCard key={post.id} post={post} />
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
                        <Link href={post.path ?? "#"}>
                          {block.listCtaLabel}
                        </Link>
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
                    <BlogPostCard post={post} />
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
