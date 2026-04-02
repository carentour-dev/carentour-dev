import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowLeft, Clock } from "lucide-react";
import { CategoryBadge } from "@/components/blog/CategoryBadge";
import { SocialShare } from "@/components/blog/SocialShare";
import { TagList } from "@/components/blog/TagList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BlockInstance } from "@/lib/cms/blocks";
import type { BlogBlockContextEntity } from "@/lib/blog/server";
import { buildLocalizedBlogLandingPath } from "@/lib/blog/server";
import { BlockSurface } from "./BlockSurface";

type BlogArticleHeroContext = {
  blog?: BlogBlockContextEntity | null;
};

export function BlogArticleHeroBlock({
  block,
  context,
  locale,
}: {
  block: BlockInstance<"blogArticleHero">;
  context?: BlogArticleHeroContext;
  locale: "en" | "ar";
}) {
  const post = context?.blog?.type === "post" ? context.blog.post : null;

  if (!post) {
    return null;
  }

  const publishDate = post.publish_date
    ? format(
        new Date(post.publish_date),
        locale === "ar" ? "dd/MM/yyyy" : "MMMM d, yyyy",
      )
    : null;
  const updatedDate = post.updated_at
    ? format(
        new Date(post.updated_at),
        locale === "ar" ? "dd/MM/yyyy" : "MMMM d, yyyy",
      )
    : null;

  return (
    <BlockSurface
      block={block}
      defaultPadding={{ top: "3rem", bottom: "3rem" }}
      contentClassName="space-y-8"
    >
      {() => (
        <>
          <div>
            <Button variant="ghost" className="-ml-4" asChild>
              <Link href={buildLocalizedBlogLandingPath(locale)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {block.backLabel}
              </Link>
            </Button>
          </div>

          <div className="mx-auto max-w-4xl">
            {block.showCategory && post.category ? (
              <CategoryBadge
                name={post.category.name}
                color={post.category.color ?? undefined}
                className="mb-4"
              />
            ) : null}

            <h1 className="text-4xl font-semibold leading-tight text-foreground md:text-6xl">
              {post.title}
            </h1>
            {post.excerpt ? (
              <p className="mt-5 text-lg leading-8 text-muted-foreground md:text-xl">
                {post.excerpt}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {block.showAuthor && post.author ? (
                <Badge variant="outline">{post.author.name}</Badge>
              ) : null}
              {block.showPublishDate && publishDate ? (
                <Badge variant="outline">
                  {block.publishDateLabel}: {publishDate}
                </Badge>
              ) : null}
              {block.showUpdatedDate && updatedDate ? (
                <Badge variant="outline">
                  {block.updatedLabel}: {updatedDate}
                </Badge>
              ) : null}
              {block.showReadingTime && post.reading_time ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5">
                  <Clock className="h-4 w-4" />
                  <span>
                    {post.reading_time} {block.readingTimeSuffix}
                  </span>
                </div>
              ) : null}
            </div>

            {block.showTags && post.tags.length > 0 ? (
              <div className="mt-6">
                <TagList tags={post.tags} />
              </div>
            ) : null}

            {block.showShareActions && post.path ? (
              <div className="mt-6">
                <SocialShare
                  url={post.path}
                  title={post.title}
                  description={post.excerpt ?? undefined}
                />
              </div>
            ) : null}
          </div>

          {block.showHeroImage && post.featured_image ? (
            <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-border/60">
              <div className="relative aspect-[16/9] bg-muted">
                <Image
                  src={post.featured_image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 72vw, 100vw"
                  priority
                />
              </div>
            </div>
          ) : null}
        </>
      )}
    </BlockSurface>
  );
}
