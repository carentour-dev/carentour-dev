import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock } from "lucide-react";
import { CategoryBadge } from "@/components/blog/CategoryBadge";
import { SocialShare } from "@/components/blog/SocialShare";
import { TagList } from "@/components/blog/TagList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BlockInstance } from "@/lib/cms/blocks";
import {
  formatBlogMetadataDate,
  formatBlogReadingTime,
  resolveBlogUiText,
} from "@/lib/blog/localization";
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

  const backLabel = resolveBlogUiText("backLabel", locale, block.backLabel);
  const publishDateLabel = resolveBlogUiText(
    "publishDateLabel",
    locale,
    block.publishDateLabel,
  );
  const updatedLabel = resolveBlogUiText(
    "updatedLabel",
    locale,
    block.updatedLabel,
  );
  const shareLabel = resolveBlogUiText("shareLabel", locale, block.shareLabel);
  const publishDate = formatBlogMetadataDate(post.publish_date, locale);
  const updatedDate = formatBlogMetadataDate(post.updated_at, locale);
  const readingTime = formatBlogReadingTime(post.reading_time, locale);

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
                {backLabel}
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
                  {publishDateLabel}: {publishDate}
                </Badge>
              ) : null}
              {block.showUpdatedDate && updatedDate ? (
                <Badge variant="outline">
                  {updatedLabel}: {updatedDate}
                </Badge>
              ) : null}
              {block.showReadingTime && readingTime ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{readingTime}</span>
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
                  label={shareLabel}
                  locale={locale}
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
